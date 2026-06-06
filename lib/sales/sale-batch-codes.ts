type SaleBatchSource = {
  thicknessStock?: { purchase: { batchCode: string } } | null;
  purchaseItem?: { purchase: { batchCode: string } } | null;
};

type SaleWithBatchSources = {
  saleItems: Array<{ sources: SaleBatchSource[] }>;
};

export function collectSaleBatchCodes(sale: SaleWithBatchSources): string[] {
  const codes = new Set<string>();

  for (const item of sale.saleItems) {
    for (const source of item.sources) {
      const code =
        source.thicknessStock?.purchase.batchCode ??
        source.purchaseItem?.purchase.batchCode;
      if (code) {
        codes.add(code);
      }
    }
  }

  return [...codes].sort((a, b) => a.localeCompare(b, "id-ID"));
}
