"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ensureAuthenticated } from "@/lib/auth/ensure-auth";

import {
  createSale,
  deleteSale,
  updateSale,
  type CreateSaleItemInput,
} from "@/lib/services/sale-service";

const saleSchema = z.object({
  saleDate: z.string().min(1, "Tanggal penjualan wajib diisi"),
  customerId: z.string().min(1, "Customer wajib dipilih"),
  clientRequestId: z.string().optional(),
  note: z.string().optional(),
});

export async function createSaleAction(formData: FormData) {
  await ensureAuthenticated();
  const payload = parseSaleForm(formData);
  await createSale(payload);

  revalidatePath("/sales");
  revalidatePath("/price-list");
  revalidatePath("/");
  revalidatePath("/stocks");

  redirect("/sales");
}

export async function deleteSaleAction(id: string) {
  await ensureAuthenticated();
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("ID penjualan tidak valid.");
  }

  await deleteSale(trimmedId);

  revalidatePath("/sales");
  revalidatePath("/price-list");
  revalidatePath("/");
  revalidatePath("/stocks");
  revalidatePath("/sales/new");

  return { success: true as const };
}

export async function updateSaleAction(id: string, formData: FormData) {
  await ensureAuthenticated();
  const payload = parseSaleForm(formData);
  await updateSale(id, payload);

  revalidatePath("/sales");
  revalidatePath("/invoices");
  revalidatePath("/price-list");
  revalidatePath(`/sales/${id}`);
  revalidatePath(`/sales/${id}/edit`);
  revalidatePath("/");
  revalidatePath("/stocks");

  redirect(`/sales/${id}`);
}

function parseSaleForm(formData: FormData) {
  const mainResult = saleSchema.safeParse({
    saleDate: formData.get("saleDate"),
    customerId: formData.get("customerId"),
    clientRequestId: formData.get("clientRequestId"),
    note: formData.get("note"),
  });

  if (!mainResult.success) {
    throw new Error(mainResult.error.issues[0]?.message ?? "Data transaksi tidak valid.");
  }

  const mainPayload = mainResult.data;

  const rawItems = String(formData.get("itemsPayload") ?? "[]");
  const parsedItems = JSON.parse(rawItems) as CreateSaleItemInput[];
  const items = parsedItems.filter(
    (item) =>
      item.qty ||
      item.price ||
      item.thickness ||
      item.width ||
      item.length ||
      item.category ||
      item.unit ||
      item.note,
  );

  if (items.length === 0) {
    throw new Error("Minimal satu item penjualan harus diisi.");
  }

  return {
    saleDate: new Date(mainPayload.saleDate),
    customerId: mainPayload.customerId,
    clientRequestId: mainPayload.clientRequestId?.trim() || undefined,
    note: mainPayload.note,
    items,
  };
}
