import { buildItemKey, normalizeItemFields, type PricingItemFields } from "@/lib/pricing/build-item-key";
import { prisma } from "@/lib/prisma";

export type CustomerPriceSuggestion = {
  itemKey: string;
  itemName: string;
  category: string | null;
  thickness: string | null;
  width: string | null;
  length: string | null;
  unit: string | null;
  latestPrice: string;
  lastSaleDate: Date;
  usageCount: number;
};

export async function findBestCustomerPriceMatch(customerId: string, item: PricingItemFields) {
  const itemKey = buildItemKey(item);
  if (!itemKey.split("|")[0]) {
    return null;
  }

  const row = await prisma.customerPriceList.findUnique({
    where: { customerId_itemKey: { customerId, itemKey } },
  });

  if (!row) {
    return null;
  }

  return {
    itemKey: row.itemKey,
    itemName: row.itemName,
    category: row.category,
    thickness: row.thickness,
    width: row.width,
    length: row.length,
    unit: row.unit,
    latestPrice: row.latestPrice.toString(),
    lastSaleDate: row.lastSaleDate,
    usageCount: 0,
  } satisfies CustomerPriceSuggestion;
}

export async function findCustomerItemSuggestions(options: {
  customerId: string;
  keyword?: string;
  limit?: number;
}): Promise<CustomerPriceSuggestion[]> {
  const keyword = (options.keyword ?? "").trim();
  const limit = Math.max(1, Math.min(options.limit ?? 8, 10));
  const normalizedKeyword = normalizeItemFields({ itemName: keyword }).itemName;

  const rows = await prisma.customerPriceList.findMany({
    where: {
      customerId: options.customerId,
      ...(keyword
        ? {
            itemName: {
              contains: keyword,
              mode: "insensitive" as const,
            },
          }
        : {}),
    },
    orderBy: [{ lastSaleDate: "desc" }, { updatedAt: "desc" }],
    take: 50,
  });

  const usageRows = await prisma.saleItem.groupBy({
    by: ["itemName", "category", "thickness", "width", "length", "unit"],
    where: {
      sale: { customerId: options.customerId },
    },
    _count: { _all: true },
  });

  const usageMap = new Map<string, number>();
  for (const row of usageRows) {
    const key = buildItemKey(row);
    usageMap.set(key, row._count._all);
  }

  const ranked = rows
    .map((row) => {
      const normalizedName = normalizeItemFields({ itemName: row.itemName }).itemName;
      const containsScore =
        normalizedKeyword && normalizedName.includes(normalizedKeyword) ? 1 : 0;
      const usageCount = usageMap.get(row.itemKey) ?? 0;
      return {
        itemKey: row.itemKey,
        itemName: row.itemName,
        category: row.category,
        thickness: row.thickness,
        width: row.width,
        length: row.length,
        unit: row.unit,
        latestPrice: row.latestPrice.toString(),
        lastSaleDate: row.lastSaleDate,
        usageCount,
        containsScore,
      };
    })
    .sort((a, b) => {
      if (b.containsScore !== a.containsScore) return b.containsScore - a.containsScore;
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return b.lastSaleDate.getTime() - a.lastSaleDate.getTime();
    })
    .slice(0, limit)
    .map((entry) => ({
      itemKey: entry.itemKey,
      itemName: entry.itemName,
      category: entry.category,
      thickness: entry.thickness,
      width: entry.width,
      length: entry.length,
      unit: entry.unit,
      latestPrice: entry.latestPrice,
      lastSaleDate: entry.lastSaleDate,
      usageCount: entry.usageCount,
    }));

  return ranked;
}
