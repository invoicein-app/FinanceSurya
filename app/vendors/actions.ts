"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureAuthenticated } from "@/lib/auth/ensure-auth";

import {
  createVendor,
  deleteVendor,
  updateVendor,
} from "@/lib/services/vendor-service";

const vendorSchema = z.object({
  name: z.string().trim().min(1, "Nama vendor wajib diisi"),
});

export async function createVendorAction(formData: FormData) {
  await ensureAuthenticated();
  const payload = vendorSchema.parse({
    name: formData.get("name"),
  });

  await createVendor(payload);
  revalidatePath("/vendors");
  revalidatePath("/purchases/new");
}

export async function updateVendorAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payload = vendorSchema.parse({
    name: formData.get("name"),
  });

  if (!id) {
    throw new Error("ID vendor tidak valid.");
  }

  await updateVendor({ id, name: payload.name });
  revalidatePath("/vendors");
  revalidatePath("/purchases/new");
}

export async function deleteVendorAction(formData: FormData) {
  await ensureAuthenticated();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("ID vendor tidak valid.");
  }

  await deleteVendor(id);
  revalidatePath("/vendors");
  revalidatePath("/purchases/new");
}
