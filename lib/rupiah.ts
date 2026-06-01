/**
 * Format angka ke tampilan ribuan Indonesia (contoh: 48000 → "48.000").
 * Aman untuk nilai dari state maupun database (string desimal seperti "48000.00").
 */
export function formatRupiah(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numeric =
    typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));

  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return Math.trunc(numeric).toLocaleString("id-ID");
}

/**
 * Parse input tampilan (dengan titik ribuan) ke angka bulat.
 * Hanya digit yang diproses.
 */
export function parseRupiah(value: string): number {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) {
    return 0;
  }
  return Number(digitsOnly);
}

/** Parse ke string digit murni untuk state / form / payload JSON. */
export function parseRupiahToString(value: string): string {
  const digitsOnly = value.replace(/[^\d]/g, "");
  return digitsOnly === "" ? "0" : digitsOnly;
}
