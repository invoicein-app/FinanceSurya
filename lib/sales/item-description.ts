type ItemDescriptionParts = {
  thickness?: string | null;
  width?: string | null;
  length?: string | null;
  mutu?: string | null;
};

function clean(value: string | null | undefined) {
  const v = String(value ?? "").trim();
  return v.length > 0 ? v : null;
}

/**
 * Generates a readable veneer label from specs.
 * Examples:
 * - Veneer 0.6 x 130 x 260
 * - Veneer 1.2 x 140
 * - Veneer
 */
export function buildVeneerItemDescription(parts: ItemDescriptionParts): string {
  const t = clean(parts.thickness);
  const w = clean(parts.width);
  const l = clean(parts.length);
  const mutu = clean(parts.mutu);

  const dims = [t, w, l].filter(Boolean).join(" x ");
  const base = dims ? `Veneer ${dims}` : "Veneer";

  return mutu ? `${base} | Mutu ${mutu}` : base;
}
