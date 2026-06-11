import { z } from "zod";

/**
 * FormData.get() mengembalikan `null` jika field tidak ada.
 * Zod 4 `z.string().optional()` hanya menerima string | undefined — bukan null.
 */
export function formDataOptionalString() {
  return z.preprocess((val) => {
    if (val == null) {
      return undefined;
    }
    const trimmed = String(val).trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().optional());
}

export function formDataRequiredString(message: string) {
  return z.preprocess((val) => (val == null ? "" : String(val)), z.string().min(1, message));
}
