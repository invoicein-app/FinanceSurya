import type { Prisma, PrismaClient } from "@prisma/client";

import { buildItemKey, normalizeItemFields, type PricingItemFields } from "@/lib/pricing/build-item-key";

export type PriceListUpsertLine = PricingItemFields & {
  itemName: string;
  price: number;
};

/** Untuk `$transaction([...])` (kompatibel Supabase pooler / PgBouncer). */
export function collectCustomerPriceListUpsertOps(
  db: Pick<PrismaClient, "customerPriceList">,
  input: {
    customerId: string;
    saleDate: Date;
    lines: PriceListUpsertLine[];
  },
): Prisma.PrismaPromise<unknown>[] {
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  for (const line of input.lines) {
    const normalized = normalizeItemFields(line);
    if (!normalized.itemName) {
      continue;
    }

    const itemKey = buildItemKey(line);
    ops.push(
      db.customerPriceList.upsert({
        where: {
          customerId_itemKey: {
            customerId: input.customerId,
            itemKey,
          },
        },
        create: {
          customerId: input.customerId,
          itemKey,
          itemName: line.itemName.trim(),
          category: line.category?.trim() || null,
          thickness: line.thickness?.trim() || null,
          width: line.width?.trim() || null,
          length: line.length?.trim() || null,
          unit: line.unit?.trim() || null,
          latestPrice: line.price.toString(),
          lastSaleDate: input.saleDate,
        },
        update: {
          itemName: line.itemName.trim(),
          category: line.category?.trim() || null,
          thickness: line.thickness?.trim() || null,
          width: line.width?.trim() || null,
          length: line.length?.trim() || null,
          unit: line.unit?.trim() || null,
          latestPrice: line.price.toString(),
          lastSaleDate: input.saleDate,
        },
      }),
    );
  }
  return ops;
}

export async function upsertCustomerPriceList(
  tx: Prisma.TransactionClient,
  input: {
    customerId: string;
    saleDate: Date;
    lines: PriceListUpsertLine[];
  },
) {
  const ops = collectCustomerPriceListUpsertOps(tx, input);
  for (const op of ops) {
    await op;
  }
}
