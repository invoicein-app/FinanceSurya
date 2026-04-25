"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createProduct } from "@/lib/services/product-service";

const productSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  category: z.string().min(1, "Kategori wajib diisi"),
  size: z.string().min(1, "Ukuran wajib diisi"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  defaultPrice: z.coerce.number().positive("Harga default harus lebih dari 0"),
});

export async function createProductAction(formData: FormData) {
  const payload = productSchema.parse({
    code: formData.get("code"),
    name: formData.get("name"),
    category: formData.get("category"),
    size: formData.get("size"),
    unit: formData.get("unit"),
    defaultPrice: formData.get("defaultPrice"),
  });

  await createProduct(payload);
  revalidatePath("/products");
  revalidatePath("/");
}
