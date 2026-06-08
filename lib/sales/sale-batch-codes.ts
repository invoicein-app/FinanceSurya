import { formatPartaiLabel, type PartaiLabelInput } from "@/lib/partai/format-partai-label";

type SaleBatchPurchase = PartaiLabelInput & {
  purchaseDate?: Date | string | null;
};

type SaleBatchSource = {
  thicknessStock?: { purchase: SaleBatchPurchase } | null;
  purchaseItem?: { purchase: SaleBatchPurchase } | null;
};

type SaleWithBatchSources = {
  saleItems: Array<{ sources: SaleBatchSource[] }>;
};

export function collectSalePartaiLabels(sale: SaleWithBatchSources): string[] {
  const labels = new Set<string>();

  for (const item of sale.saleItems) {
    for (const source of item.sources) {
      const purchase =
        source.thicknessStock?.purchase ?? source.purchaseItem?.purchase;
      if (purchase) {
        labels.add(formatPartaiLabel(purchase));
      }
    }
  }

  return [...labels].sort((a, b) => a.localeCompare(b, "id-ID"));
}

/** @deprecated Gunakan collectSalePartaiLabels */
export function collectSaleBatchCodes(sale: SaleWithBatchSources): string[] {
  return collectSalePartaiLabels(sale);
}
