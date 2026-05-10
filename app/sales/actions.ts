"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSale, updateSale, type CreateSaleItemInput } from "@/lib/services/sale-service";

const saleSchema = z.object({
  saleDate: z.string().min(1, "Tanggal penjualan wajib diisi"),
  customerId: z.string().min(1, "Customer wajib dipilih"),
  note: z.string().optional(),
});

export async function createSaleAction(formData: FormData) {
  const payload = parseSaleForm(formData);
  await createSale(payload);

  revalidatePath("/sales");
  revalidatePath("/price-list");
  revalidatePath("/");
  revalidatePath("/stocks");

  redirect("/sales");
}

export async function updateSaleAction(id: string, formData: FormData) {
  const payload = parseSaleForm(formData);
  await updateSale(id, payload);

  revalidatePath("/sales");
  revalidatePath("/price-list");
  revalidatePath(`/sales/${id}`);
  revalidatePath(`/sales/${id}/edit`);
  revalidatePath("/");
  revalidatePath("/stocks");
}

function parseSaleForm(formData: FormData) {
  const mainPayload = saleSchema.parse({
    saleDate: formData.get("saleDate"),
    customerId: formData.get("customerId"),
    note: formData.get("note"),
  });

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
    note: mainPayload.note,
    items,
  };
}
