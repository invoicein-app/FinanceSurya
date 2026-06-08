"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ensureAuthenticated } from "@/lib/auth/ensure-auth";

import { normalizeThicknessMmFormValue } from "@/lib/sales/thickness-mm";
import {
  createThicknessStockRow,
  createWoodPurchase,
  deleteThicknessStockRow,
  deleteWoodPurchase,
  getPartaiTransferDestinationPreview,
  transferSaleAllocationToPartai,
  updateWoodPurchase,
  type WoodPurchaseItemInput,
} from "@/lib/services/wood-purchase-service";

const purchaseSchema = z.object({
  clientRequestId: z.string().optional(),
  vendorId: z.string().min(1, "Vendor wajib dipilih"),
  purchaseDate: z.string().min(1, "Tanggal pembelian wajib diisi"),
  batchCode: z.string().trim().min(1, "Kode partai wajib diisi"),
  batchYear: z.coerce.number().int().min(1900).max(2100),
  woodSpecies: z.string().optional(),
  documentNumber: z.string().optional(),
  note: z.string().optional(),
  bpCost: z.coerce.number().min(0),
  cuttingCost: z.coerce.number().min(0),
  shippingCost: z.coerce.number().min(0),
  woodPrice: z.coerce.number().min(0),
  grandTotal: z.coerce.number().min(0),
});

export async function createPurchaseAction(formData: FormData) {
  await ensureAuthenticated();
  const payload = parsePurchaseForm(formData);
  const purchase = await createWoodPurchase(payload);
  revalidatePath("/purchases");
  revalidatePath("/stocks");
  revalidatePath("/sales/new");
  redirect(`/purchases/${purchase.id}`);
}

export async function updatePurchaseAction(id: string, formData: FormData) {
  await ensureAuthenticated();
  const payload = parsePurchaseForm(formData);
  await updateWoodPurchase(id, payload);
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${id}`);
  revalidatePath("/stocks");
  revalidatePath("/sales/new");
  revalidatePath("/sales");
  redirect(`/purchases/${id}`);
}

function parsePurchaseForm(formData: FormData) {
  const main = purchaseSchema.parse({
    clientRequestId: formData.get("clientRequestId"),
    vendorId: formData.get("vendorId"),
    purchaseDate: formData.get("purchaseDate"),
    batchCode: formData.get("batchCode"),
    batchYear: formData.get("batchYear"),
    woodSpecies: formData.get("woodSpecies"),
    documentNumber: formData.get("documentNumber"),
    note: formData.get("note"),
    bpCost: formData.get("bpCost"),
    cuttingCost: formData.get("cuttingCost"),
    shippingCost: formData.get("shippingCost"),
    woodPrice: formData.get("woodPrice"),
    grandTotal: formData.get("grandTotal"),
  });

  const itemIds = formData.getAll("itemId");
  const woodTypes = formData.getAll("woodType");
  const lengths = formData.getAll("length");
  const diameters = formData.getAll("diameter");
  const volumes = formData.getAll("volume");
  const mutus = formData.getAll("mutu");
  const notes = formData.getAll("itemNote");

  const items: WoodPurchaseItemInput[] = woodTypes
    .map((_, index) => ({
      id: normalizeOptionalString(itemIds[index]),
      woodType: String(woodTypes[index] ?? "").trim(),
      length: normalizeOptionalNumber(lengths[index]),
      diameter: normalizeOptionalNumber(diameters[index]),
      logQty: 1,
      volume: Number(volumes[index] ?? 0),
      mutu: normalizeOptionalString(mutus[index]),
      note: normalizeOptionalString(notes[index]),
    }))
    .filter((item) => item.woodType || item.volume > 0);

  return {
    vendorId: main.vendorId,
    clientRequestId: main.clientRequestId?.trim() || undefined,
    purchaseDate: new Date(main.purchaseDate),
    batchCode: main.batchCode,
    batchYear: main.batchYear,
    woodSpecies: main.woodSpecies?.trim() || undefined,
    documentNumber: main.documentNumber,
    note: main.note,
    bpCost: main.bpCost,
    cuttingCost: main.cuttingCost,
    shippingCost: main.shippingCost,
    woodPrice: main.woodPrice,
    grandTotal: main.grandTotal,
    items,
  };
}

function normalizeOptionalString(value: FormDataEntryValue | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalNumber(value: FormDataEntryValue | undefined) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return undefined;
  }
  const number = Number(normalized);
  return Number.isNaN(number) ? undefined : number;
}

const thicknessMmSchema = z.preprocess(
  (val) => normalizeThicknessMmFormValue(val),
  z
    .string()
    .min(1, "Ketebalan wajib diisi.")
    .transform((s) => Number(s))
    .refine((n) => Number.isFinite(n) && n > 0, {
      message: "Ketebalan harus angka lebih dari 0; pakai titik untuk desimal (mis. 0.6).",
    }),
);

const thicknessStockSchema = z.object({
  thicknessMm: thicknessMmSchema,
  qtyInitial: z.coerce.number().min(0, "Qty tidak boleh negatif"),
  unit: z.string().optional(),
});

export async function addThicknessStockAction(formData: FormData) {
  await ensureAuthenticated();
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();
  if (!purchaseId) {
    throw new Error("Partai tidak valid.");
  }
  const parsed = thicknessStockSchema.parse({
    thicknessMm: formData.get("thicknessMm"),
    qtyInitial: formData.get("qtyInitial"),
    unit: formData.get("unit"),
  });
  try {
    await createThicknessStockRow({
      purchaseId,
      thicknessMm: parsed.thicknessMm,
      qtyInitial: parsed.qtyInitial,
      unit: parsed.unit,
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      throw new Error("Ketebalan ini sudah ada untuk partai tersebut.");
    }
    throw error;
  }
  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath("/stocks");
  revalidatePath("/sales/new");
  revalidatePath("/sales");
}

export async function deletePurchaseAction(id: string) {
  await ensureAuthenticated();
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("ID partai tidak valid.");
  }

  await deleteWoodPurchase(trimmedId);

  revalidatePath("/purchases");
  revalidatePath("/stocks");
  revalidatePath("/sales/new");
  revalidatePath("/sales");

  return { success: true as const };
}

export async function previewPartaiTransferDestinationAction(
  destinationPurchaseId: string,
  thicknessMmLabel: string,
) {
  await ensureAuthenticated();
  const destId = destinationPurchaseId.trim();
  if (!destId) {
    throw new Error("Partai tujuan wajib dipilih.");
  }
  return getPartaiTransferDestinationPreview(destId, thicknessMmLabel);
}

export async function transferSaleAllocationAction(
  sourceId: string,
  fromPurchaseId: string,
  destinationPurchaseId: string,
) {
  await ensureAuthenticated();
  const sid = sourceId.trim();
  const fromId = fromPurchaseId.trim();
  const destId = destinationPurchaseId.trim();
  if (!sid || !fromId || !destId) {
    throw new Error("Data pemindahan tidak lengkap.");
  }

  const result = await transferSaleAllocationToPartai({
    sourceId: sid,
    fromPurchaseId: fromId,
    destinationPurchaseId: destId,
  });

  revalidatePath(`/purchases/${result.fromPurchaseId}`);
  revalidatePath(`/purchases/${result.destinationPurchaseId}`);
  revalidatePath(`/sales/${result.saleId}`);
  revalidatePath("/purchases");
  revalidatePath("/stocks");
  revalidatePath("/sales");

  return result;
}

export async function deleteThicknessStockAction(formData: FormData) {
  await ensureAuthenticated();
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();
  const stockId = String(formData.get("stockId") ?? "").trim();
  if (!purchaseId || !stockId) {
    throw new Error("Permintaan hapus tidak valid.");
  }
  await deleteThicknessStockRow(stockId);
  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath("/stocks");
  revalidatePath("/sales/new");
  revalidatePath("/sales");
}
