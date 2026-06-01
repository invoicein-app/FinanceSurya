/**
 * Nilai `YYYY-MM-DD` untuk input HTML `type="date"` (tanggal lokal).
 * Selaras dengan format edit: `date.toISOString().slice(0, 10)`.
 */
export function getTodayDateValue(): string {
  return new Date().toLocaleDateString("en-CA");
}
