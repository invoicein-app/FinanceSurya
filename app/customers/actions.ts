"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  CUSTOMER_DUPLICATE_NAME_MESSAGE,
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "@/lib/services/customer-service";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Nama customer wajib diisi"),
});

export async function createCustomerAction(formData: FormData) {
  const payload = customerSchema.parse({
    name: formData.get("name"),
  });

  try {
    await createCustomer(payload);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === CUSTOMER_DUPLICATE_NAME_MESSAGE
    ) {
      redirect("/customers?error=duplicate");
    }
    throw error;
  }

  revalidatePath("/customers");
  revalidatePath("/sales/new");
  redirect("/customers");
}

export async function updateCustomerAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payload = customerSchema.parse({
    name: formData.get("name"),
  });

  if (!id) {
    throw new Error("ID customer tidak valid.");
  }

  try {
    await updateCustomer({ id, name: payload.name });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === CUSTOMER_DUPLICATE_NAME_MESSAGE
    ) {
      redirect("/customers?error=duplicate");
    }
    throw error;
  }

  revalidatePath("/customers");
  revalidatePath("/sales/new");
  redirect("/customers");
}

export async function deleteCustomerAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("ID customer tidak valid.");
  }

  await deleteCustomer(id);
  revalidatePath("/customers");
  revalidatePath("/sales/new");
}
