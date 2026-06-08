/** Input minimal untuk label identitas partai (tanpa dependensi Prisma). */
export type PartaiLabelInput = {
  batchCode: string;
  batchYear?: number | null;
  woodSpecies?: string | null;
  /** Fallback tahun dari tanggal pembelian jika batchYear belum diisi (data lama). */
  purchaseDate?: Date | string | null;
};

const MISSING_YEAR = "Tanpa Tahun";
const MISSING_SPECIES = "Tanpa Jenis Kayu";

export function resolvePartaiYear(input: PartaiLabelInput): string {
  if (input.batchYear != null && Number.isFinite(input.batchYear)) {
    return String(input.batchYear);
  }
  if (input.purchaseDate) {
    const d = new Date(input.purchaseDate);
    if (!Number.isNaN(d.getTime())) {
      return String(d.getFullYear());
    }
  }
  return MISSING_YEAR;
}

export function resolveWoodSpecies(woodSpecies?: string | null): string {
  const trimmed = woodSpecies?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : MISSING_SPECIES;
}

/** Format: P12 - 2025 - Jati */
export function formatPartaiLabel(input: PartaiLabelInput): string {
  const code = input.batchCode?.trim() || "—";
  const year = resolvePartaiYear(input);
  const species = resolveWoodSpecies(input.woodSpecies);
  return `${code} - ${year} - ${species}`;
}

export function formatPartaiThicknessSource(
  purchase: PartaiLabelInput,
  thicknessMm: string | number | { toString(): string },
  qtyTaken: number,
): string {
  return `${formatPartaiLabel(purchase)} — ketebalan ${String(thicknessMm)} mm — qty ${qtyTaken.toLocaleString("id-ID")}`;
}

export function formatPartaiKaplingSource(
  purchase: PartaiLabelInput,
  noKapling: string,
  qtyTaken: number,
  volumeTaken?: number,
): string {
  const base = `${formatPartaiLabel(purchase)} / Kapling ${noKapling} — qty ${qtyTaken.toLocaleString("id-ID")}`;
  if (volumeTaken != null) {
    return `${base} — vol ${volumeTaken.toLocaleString("id-ID")}`;
  }
  return base;
}

/** Untuk pencarian/filter — gabungkan semua teks identitas. */
export function partaiSearchText(input: PartaiLabelInput): string {
  return [
    input.batchCode,
    resolvePartaiYear(input),
    resolveWoodSpecies(input.woodSpecies),
    formatPartaiLabel(input),
  ]
    .join(" ")
    .toLowerCase();
}
