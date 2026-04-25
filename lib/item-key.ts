import { buildItemKey, normalizeItemSegment, type PricingItemFields } from "@/lib/pricing/build-item-key";

export type SaleItemKeyParts = PricingItemFields & { itemName: string };

export function buildSaleItemKey(parts: SaleItemKeyParts): string {
  return buildItemKey(parts);
}

export { normalizeItemSegment };
