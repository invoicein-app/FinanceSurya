type VeneerSpecInput = {
  thickness?: string | null;
  width?: string | null;
  length?: string | null;
  grade?: string | null;
  unit?: string | null;
};

function normalizeNumericLike(value: string | null | undefined) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) {
    return "";
  }
  const asNum = Number(raw);
  if (!Number.isFinite(asNum)) {
    return raw.replace(/\s+/g, " ");
  }
  return String(asNum);
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

export function normalizeVeneerSpec(input: VeneerSpecInput) {
  return {
    thickness: normalizeNumericLike(input.thickness),
    width: normalizeNumericLike(input.width),
    length: normalizeNumericLike(input.length),
    grade: normalizeText(input.grade),
    unit: normalizeText(input.unit),
  };
}

export function buildVeneerSpecKey(input: VeneerSpecInput) {
  const normalized = normalizeVeneerSpec(input);
  return [
    normalized.thickness,
    normalized.width,
    normalized.length,
    normalized.grade,
    normalized.unit,
  ].join("|");
}
