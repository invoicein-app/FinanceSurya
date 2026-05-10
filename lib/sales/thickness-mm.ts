/**
 * Ketebalan di aplikasi ini dipakai dengan pemisah desimal titik (.). Untuk kompatibilitas
 * copy-paste, semua koma dinormalisasi ke titik sebelum diparse.
 */
export function normalizeThicknessMmFormValue(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/\u00a0/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, ".");
}

/**
 * Input teks kolom Tebal / ketebalan (mm): hanya digit dan satu titik desimal.
 * Koma tidak ditampilkan saat mengetik; paste "0,6" menjadi "0.6".
 */
export function sanitizeThicknessMmTyping(raw: string): string {
  let s = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const dotIndex = s.indexOf(".");
  if (dotIndex === -1) {
    return s;
  }
  const head = s.slice(0, dotIndex).replace(/\./g, "");
  const tail = s.slice(dotIndex + 1).replace(/\./g, "");
  return `${head}.${tail}`;
}

/** Qty penjualan: sama seperti kolom Tebal — desimal hanya titik; paste dengan koma dinormalisasi. */
export function sanitizeSaleQtyTyping(raw: string): string {
  return sanitizeThicknessMmTyping(raw);
}

/**
 * Normalisasi input Tebal item (mm) untuk lookup stok partai.
 * Contoh: "0,6" → "0.6", " 1.200 " → "1.2"
 */
export function parseThicknessMmForStock(input: string | undefined | null): string | null {
  const raw = normalizeThicknessMmFormValue(input);
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
