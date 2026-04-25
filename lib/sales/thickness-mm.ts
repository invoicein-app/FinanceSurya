/**
 * Normalisasi input Tebal item (mm) untuk lookup stok partai.
 * Contoh: "0,6" → "0.6", " 1.200 " → "1.2"
 */
export function parseThicknessMmForStock(input: string | undefined | null): string | null {
  const raw = String(input ?? "").trim().replace(",", ".");
  if (!raw) {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return String(n);
}

/** Bandingkan nilai ketebalan dari DB (string/Decimal) dengan nilai mm yang sudah dinormalisasi. */
export function thicknessMmMatches(stored: string, normalizedMm: string): boolean {
  return Math.abs(Number(stored) - Number(normalizedMm)) < 1e-6;
}
