export type PricingItemFields = {
  itemName?: string | null;
  category?: string | null;
  thickness?: string | null;
  width?: string | null;
  length?: string | null;
  unit?: string | null;
};

export function normalizeItemSegment(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizeItemFields<T extends PricingItemFields>(item: T) {
  return {
    itemName: normalizeItemSegment(item.itemName),
    category: normalizeItemSegment(item.category),
    thickness: normalizeItemSegment(item.thickness),
    width: normalizeItemSegment(item.width),
    length: normalizeItemSegment(item.length),
    unit: normalizeItemSegment(item.unit),
  };
}

export function buildItemKey(item: PricingItemFields): string {
  const normalized = normalizeItemFields(item);
  return [
    normalized.itemName,
    normalized.category,
    normalized.thickness,
    normalized.width,
    normalized.length,
    normalized.unit,
  ].join("|");
}
