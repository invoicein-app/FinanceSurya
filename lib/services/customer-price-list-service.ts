import type { Prisma } from "@prisma/client";

import {
  findBestCustomerPriceMatch,
  findCustomerItemSuggestions,
  type CustomerPriceSuggestion,
} from "@/lib/pricing/find-customer-price";
import { upsertCustomerPriceList, type PriceListUpsertLine } from "@/lib/pricing/upsert-customer-price-list";
import { prisma } from "@/lib/prisma";

/**
 * Setelah penjualan disimpan: upsert satu baris per itemKey untuk customer.
 * Harga dan tanggal mengikuti transaksi ini (harga terbaru menggantikan yang lama).
 */
export async function upsertCustomerPriceListFromSaleLines(
  tx: Prisma.TransactionClient,
  input: {
    customerId: string;
    saleDate: Date;
    lines: PriceListUpsertLine[];
  },
) {
  await upsertCustomerPriceList(tx, input);
}

export async function getCustomerPriceListHints(customerId: string) {
  const rows = await prisma.customerPriceList.findMany({
    where: { customerId },
    select: {
      itemKey: true,
      latestPrice: true,
      itemName: true,
      category: true,
      thickness: true,
      width: true,
      length: true,
      unit: true,
    },
  });

  const byKey: Record<string, { latestPrice: string }> = {};
  for (const row of rows) {
    byKey[row.itemKey] = {
      latestPrice: row.latestPrice.toString(),
    };
  }
  return byKey;
}

export async function getCustomerItemSuggestions(options: {
  customerId: string;
  keyword?: string;
  limit?: number;
}): Promise<CustomerPriceSuggestion[]> {
  return findCustomerItemSuggestions(options);
}

export async function findCustomerLatestPriceByExactItemKey(input: {
  customerId: string;
  itemName: string;
  category?: string | null;
  thickness?: string | null;
  width?: string | null;
  length?: string | null;
  unit?: string | null;
}) {
  return findBestCustomerPriceMatch(input.customerId, input);
}

export type PriceListPageRow = {
  id: string;
  itemName: string;
  category: string | null;
  thickness: string | null;
  width: string | null;
  length: string | null;
  unit: string | null;
  latestPrice: string;
  lastSaleDate: Date;
  customer: { id: string; name: string };
};

export async function getCustomerPriceListForPage(options: {
  customerId: string;
  search?: string;
}): Promise<PriceListPageRow[]> {
  const search = options.search?.trim();

  const rows = await prisma.customerPriceList.findMany({
    where: {
      customerId: options.customerId,
      ...(search
        ? {
            itemName: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    },
    orderBy: [{ lastSaleDate: "desc" }, { itemName: "asc" }],
    include: {
      customer: {
        select: { id: true, name: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    itemName: row.itemName,
    category: row.category,
    thickness: row.thickness,
    width: row.width,
    length: row.length,
    unit: row.unit,
    latestPrice: row.latestPrice.toString(),
    lastSaleDate: row.lastSaleDate,
    customer: row.customer,
  }));
}
