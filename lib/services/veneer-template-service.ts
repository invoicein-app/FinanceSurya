import { Prisma, type PrismaClient } from "@prisma/client";

import { buildVeneerItemDescription } from "@/lib/sales/item-description";
import { buildVeneerSpecKey, normalizeVeneerSpec } from "@/lib/sales/veneer-template-spec";
import { prisma } from "@/lib/prisma";

export type VeneerTemplateRow = {
  id: string;
  customerId: string;
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

type VeneerTemplatePayload = {
  customerId: string;
  templateName: string;
  specKey: string;
  thickness: string | null;
  width: string | null;
  length: string | null;
  grade: string | null;
  unit: string | null;
  defaultPrice: string;
};

type PriceListTemplateSource = {
  customerId: string;
  itemName: string;
  category: string | null;
  thickness: string | null;
  width: string | null;
  length: string | null;
  unit: string | null;
  latestPrice: Prisma.Decimal;
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

function mapVeneerTemplateRows(
  rows: Array<{
    id: string;
    customerId: string;
    templateName: string;
    specKey: string;
    thickness: string | null;
    width: string | null;
    length: string | null;
    grade: string | null;
    unit: string | null;
    defaultPrice: Prisma.Decimal | null;
    source: string;
  }>,
): VeneerTemplateRow[] {
  return rows.map((row) => ({
    id: row.id,
    customerId: row.customerId,
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

function buildTemplatePayloadFromSpecs(input: {
  customerId: string;
  itemName?: string;
  thickness?: string | null;
  width?: string | null;
  length?: string | null;
  grade?: string | null;
  unit?: string | null;
  price: number | string | Prisma.Decimal;
}): VeneerTemplatePayload | null {
  const normalized = normalizeVeneerSpec({
    thickness: input.thickness,
    width: input.width,
    length: input.length,
    grade: input.grade,
    unit: input.unit,
  });
  const hasAnyCoreSpec = Boolean(
    normalized.thickness || normalized.width || normalized.length || normalized.grade,
  );
  if (!hasAnyCoreSpec) {
    return null;
  }

  const specKey = buildVeneerSpecKey({
    thickness: normalized.thickness,
    width: normalized.width,
    length: normalized.length,
    grade: normalized.grade,
    unit: normalized.unit,
  });
  const templateName =
    String(input.itemName ?? "").trim() ||
    buildVeneerItemDescription({
      thickness: normalized.thickness,
      width: normalized.width,
      length: normalized.length,
      mutu: normalized.grade,
    });

  return {
    customerId: input.customerId,
    templateName,
    specKey,
    thickness: normalized.thickness || null,
    width: normalized.width || null,
    length: normalized.length || null,
    grade: normalized.grade || null,
    unit: normalized.unit || null,
    defaultPrice: String(input.price),
  };
}

function buildTemplatePayloadFromPriceListRow(
  row: PriceListTemplateSource,
): VeneerTemplatePayload | null {
  return buildTemplatePayloadFromSpecs({
    customerId: row.customerId,
    itemName: row.itemName,
    thickness: row.thickness,
    width: row.width,
    length: row.length,
    grade: row.category,
    unit: row.unit,
    price: row.latestPrice,
  });
}

/** Template aktif milik satu customer — hanya dari tabel VeneerTemplate. */
export async function getActiveVeneerTemplatesForCustomer(
  customerId: string,
): Promise<VeneerTemplateRow[]> {
  const trimmedCustomerId = customerId.trim();
  if (!trimmedCustomerId) {
    return [];
  }

  try {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        customerId: string;
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
        "customerId",
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
        AND "customerId" = ${trimmedCustomerId}
      ORDER BY "templateName" ASC
    `);
    return mapVeneerTemplateRows(rows);
  } catch (error) {
    if (isMissingVeneerTemplateTableError(error)) {
      return [];
    }
    throw error;
  }
}

async function upsertVeneerTemplatePayload(
  payload: VeneerTemplatePayload,
  source: string,
): Promise<"inserted" | "updated"> {
  const existing = await prisma.veneerTemplate.findFirst({
    where: {
      customerId: payload.customerId,
      specKey: payload.specKey,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.veneerTemplate.update({
      where: { id: existing.id },
      data: {
        templateName: payload.templateName,
        thickness: payload.thickness,
        width: payload.width,
        length: payload.length,
        grade: payload.grade,
        unit: payload.unit,
        defaultPrice: payload.defaultPrice,
        isActive: true,
      },
    });
    return "updated";
  }

  await prisma.veneerTemplate.create({
    data: {
      customerId: payload.customerId,
      templateName: payload.templateName,
      specKey: payload.specKey,
      thickness: payload.thickness,
      width: payload.width,
      length: payload.length,
      grade: payload.grade,
      unit: payload.unit,
      defaultPrice: payload.defaultPrice,
      isActive: true,
      source,
    },
  });

  return "inserted";
}

/**
 * Salin / sinkronkan CustomerPriceList → VeneerTemplate (one-time atau manual).
 * Setelah ini form penjualan cukup baca VeneerTemplate saja.
 */
export async function backfillVeneerTemplatesFromPriceList(options?: {
  customerId?: string;
}): Promise<{ inserted: number; updated: number; skipped: number }> {
  const trimmedCustomerId = options?.customerId?.trim();
  const rows = await prisma.customerPriceList.findMany({
    where: trimmedCustomerId ? { customerId: trimmedCustomerId } : undefined,
    orderBy: [{ lastSaleDate: "desc" }, { itemName: "asc" }],
    select: {
      customerId: true,
      itemName: true,
      category: true,
      thickness: true,
      width: true,
      length: true,
      unit: true,
      latestPrice: true,
    },
  });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const seen = new Set<string>();

  for (const row of rows) {
    const payload = buildTemplatePayloadFromPriceListRow(row);
    if (!payload) {
      skipped += 1;
      continue;
    }

    const dedupeKey = `${payload.customerId}|${payload.specKey}`;
    if (seen.has(dedupeKey)) {
      skipped += 1;
      continue;
    }
    seen.add(dedupeKey);

    const result = await upsertVeneerTemplatePayload(payload, "price-list-backfill");
    if (result === "inserted") {
      inserted += 1;
    } else {
      updated += 1;
    }
  }

  return { inserted, updated, skipped };
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
  customerId: string,
  lines: VeneerSaleLineInput[],
): Promise<Prisma.PrismaPromise<unknown>[]> {
  const trimmedCustomerId = customerId.trim();
  if (!trimmedCustomerId) {
    return [];
  }

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
    const payload = buildTemplatePayloadFromSpecs({
      customerId: trimmedCustomerId,
      thickness: line.thickness,
      width: line.width,
      length: line.length,
      grade: line.grade,
      unit: line.unit,
      price: line.price,
    });
    if (!payload) {
      continue;
    }

    const existingRows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM "VeneerTemplate"
      WHERE "customerId" = ${trimmedCustomerId}
        AND "specKey" = ${payload.specKey}
      LIMIT 1
    `);
    const existing = existingRows[0];

    if (!existing) {
      out.push(
        db.$executeRaw(Prisma.sql`
          INSERT INTO "VeneerTemplate"
            ("id", "customerId", "templateName", "specKey", "thickness", "width", "length", "grade", "unit", "defaultPrice", "isActive", "source", "createdAt", "updatedAt")
          VALUES
            (gen_random_uuid()::text, ${payload.customerId}, ${payload.templateName}, ${payload.specKey}, ${payload.thickness}, ${payload.width}, ${payload.length}, ${payload.grade}, ${payload.unit}, ${payload.defaultPrice}, true, 'auto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `),
      );
      continue;
    }

    out.push(
      db.$executeRaw(Prisma.sql`
        UPDATE "VeneerTemplate"
        SET
          "templateName" = ${payload.templateName},
          thickness = ${payload.thickness},
          width = ${payload.width},
          length = ${payload.length},
          grade = ${payload.grade},
          unit = ${payload.unit},
          "defaultPrice" = ${payload.defaultPrice},
          "isActive" = true,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${existing.id}
          AND "customerId" = ${trimmedCustomerId}
      `),
    );
  }
  return out;
}

export async function upsertVeneerTemplatesFromSaleLines(
  tx: Prisma.TransactionClient,
  customerId: string,
  lines: VeneerSaleLineInput[],
) {
  const ops = await collectVeneerTemplateSaleSqlOps(tx, customerId, lines);
  for (const op of ops) {
    await op;
  }
}
