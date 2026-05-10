import { Prisma, type PrismaClient } from "@prisma/client";

import { buildVeneerItemDescription } from "@/lib/sales/item-description";
import { buildVeneerSpecKey, normalizeVeneerSpec } from "@/lib/sales/veneer-template-spec";
import { prisma } from "@/lib/prisma";

export type VeneerTemplateRow = {
  id: string;
  templateName: string;
  specKey: string;
  thickness: string | null;
  width: string | null;
  length: string | null;
  grade: string | null;
  unit: string | null;
  defaultPrice: string | null;
  source: string;
};

function isMissingVeneerTemplateTableError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  const pgCode =
    typeof error.meta === "object" && error.meta && "code" in error.meta
      ? String((error.meta as { code?: unknown }).code ?? "")
      : "";
  return error.code === "P2010" && pgCode === "42P01";
}

export async function getActiveVeneerTemplates(): Promise<VeneerTemplateRow[]> {
  let rows: Array<{
    id: string;
    templateName: string;
    specKey: string;
    thickness: string | null;
    width: string | null;
    length: string | null;
    grade: string | null;
    unit: string | null;
    defaultPrice: Prisma.Decimal | null;
    source: string;
  }>;
  try {
    rows = await prisma.$queryRaw<
      Array<{
        id: string;
        templateName: string;
        specKey: string;
        thickness: string | null;
        width: string | null;
        length: string | null;
        grade: string | null;
        unit: string | null;
        defaultPrice: Prisma.Decimal | null;
        source: string;
      }>
    >(Prisma.sql`
      SELECT
        id,
        "templateName",
        "specKey",
        thickness,
        width,
        length,
        grade,
        unit,
        "defaultPrice",
        source
      FROM "VeneerTemplate"
      WHERE "isActive" = true
      ORDER BY "updatedAt" DESC, "templateName" ASC
    `);
  } catch (error) {
    if (isMissingVeneerTemplateTableError(error)) {
      return [];
    }
    throw error;
  }
  return rows.map((row) => ({
    id: row.id,
    templateName: row.templateName,
    specKey: row.specKey,
    thickness: row.thickness,
    width: row.width,
    length: row.length,
    grade: row.grade,
    unit: row.unit,
    defaultPrice: row.defaultPrice ? row.defaultPrice.toString() : null,
    source: row.source,
  }));
}

export type VeneerSaleLineInput = {
  thickness?: string;
  width?: string;
  length?: string;
  grade?: string;
  unit?: string;
  price: number;
};

/**
 * SELECT dilakukan sebelum batch (agar INSERT/UPDATE bisa masuk `$transaction([...])`
 * tanpa interactive tx — cocok untuk Supabase pooler).
 */
export async function collectVeneerTemplateSaleSqlOps(
  db: Pick<PrismaClient, "$queryRaw" | "$executeRaw">,
  lines: VeneerSaleLineInput[],
): Promise<Prisma.PrismaPromise<unknown>[]> {
  const out: Prisma.PrismaPromise<unknown>[] = [];
  try {
    await db.$queryRaw(Prisma.sql`SELECT 1 FROM "VeneerTemplate" LIMIT 1`);
  } catch (error) {
    if (isMissingVeneerTemplateTableError(error)) {
      return [];
    }
    throw error;
  }

  for (const line of lines) {
    const normalized = normalizeVeneerSpec({
      thickness: line.thickness,
      width: line.width,
      length: line.length,
      grade: line.grade,
      unit: line.unit,
    });
    const hasAnyCoreSpec = Boolean(
      normalized.thickness || normalized.width || normalized.length || normalized.grade,
    );
    if (!hasAnyCoreSpec) {
      continue;
    }

    const specKey = buildVeneerSpecKey({
      thickness: normalized.thickness,
      width: normalized.width,
      length: normalized.length,
      grade: normalized.grade,
      unit: normalized.unit,
    });
    const templateName = buildVeneerItemDescription({
      thickness: normalized.thickness,
      width: normalized.width,
      length: normalized.length,
      mutu: normalized.grade,
    });

    const existingRows = await db.$queryRaw<
      Array<{ id: string; defaultPrice: Prisma.Decimal | null }>
    >(Prisma.sql`
      SELECT id, "defaultPrice"
      FROM "VeneerTemplate"
      WHERE "specKey" = ${specKey}
      LIMIT 1
    `);
    const existing = existingRows[0];

    if (!existing) {
      out.push(
        db.$executeRaw(Prisma.sql`
          INSERT INTO "VeneerTemplate"
            ("id", "templateName", "specKey", "thickness", "width", "length", "grade", "unit", "defaultPrice", "isActive", "source", "createdAt", "updatedAt")
          VALUES
            (gen_random_uuid()::text, ${templateName}, ${specKey}, ${normalized.thickness || null}, ${normalized.width || null}, ${normalized.length || null}, ${normalized.grade || null}, ${normalized.unit || null}, ${line.price.toString()}, true, 'auto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `),
      );
      continue;
    }

    if (!existing.defaultPrice) {
      out.push(
        db.$executeRaw(Prisma.sql`
          UPDATE "VeneerTemplate"
          SET "defaultPrice" = ${line.price.toString()}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${existing.id}
        `),
      );
    }
  }
  return out;
}

export async function upsertVeneerTemplatesFromSaleLines(
  tx: Prisma.TransactionClient,
  lines: VeneerSaleLineInput[],
) {
  const ops = await collectVeneerTemplateSaleSqlOps(tx, lines);
  for (const op of ops) {
    await op;
  }
}
