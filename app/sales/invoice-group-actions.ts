"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ensureAuthenticated } from "@/lib/auth/ensure-auth";
import { formDataOptionalString, formDataRequiredString } from "@/lib/zod/form-data";
import {
  createInvoiceGroup,
  deleteInvoiceGroup,
  recordInvoiceGroupPayment,
  removeSaleFromInvoiceGroup,
  updateInvoiceGroup,
} from "@/lib/services/invoice-group-service";

const createInvoiceGroupSchema = z.object({
  saleIds: z.array(z.string().min(1)).min(1, "Pilih minimal 1 penjualan."),
  manualInvoiceCode: z.string().trim().min(1, "Kode invoice wajib diisi."),
  invoiceDate: z.string().min(1, "Tanggal invoice wajib diisi."),
  notes: formDataOptionalString(),
});

export type CreateInvoiceGroupActionResult =
  | { ok: true; invoiceGroupId: string; manualInvoiceCode: string }
  | { ok: false; error: string };

export async function createInvoiceGroupAction(
  input: z.infer<typeof createInvoiceGroupSchema>,
): Promise<CreateInvoiceGroupActionResult> {
  await ensureAuthenticated();

  const parsed = createInvoiceGroupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  try {
    const group = await createInvoiceGroup({
      saleIds: parsed.data.saleIds,
      manualInvoiceCode: parsed.data.manualInvoiceCode,
      invoiceDate: new Date(parsed.data.invoiceDate),
      notes: parsed.data.notes,
    });

    revalidatePath("/sales");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${group.id}`);

    return {
      ok: true,
      invoiceGroupId: group.id,
      manualInvoiceCode: group.manualInvoiceCode,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal membuat invoice group.",
    };
  }
}

const updateInvoiceGroupSchema = z.object({
  invoiceGroupId: z.string().min(1),
  manualInvoiceCode: z.string().trim().min(1, "Kode invoice wajib diisi."),
  invoiceDate: z.string().min(1, "Tanggal invoice wajib diisi."),
  notes: formDataOptionalString(),
  paidAmount: z.coerce.number().min(0, "Jumlah pembayaran tidak boleh negatif."),
});

export type UpdateInvoiceGroupActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateInvoiceGroupAction(
  input: z.infer<typeof updateInvoiceGroupSchema>,
): Promise<UpdateInvoiceGroupActionResult> {
  await ensureAuthenticated();

  const parsed = updateInvoiceGroupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  try {
    await updateInvoiceGroup(parsed.data.invoiceGroupId, {
      manualInvoiceCode: parsed.data.manualInvoiceCode,
      invoiceDate: new Date(parsed.data.invoiceDate),
      notes: parsed.data.notes,
      paidAmount: parsed.data.paidAmount,
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${parsed.data.invoiceGroupId}`);
    revalidatePath("/sales");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui invoice group.",
    };
  }
}

export async function deleteInvoiceGroupAction(id: string) {
  await ensureAuthenticated();
  await deleteInvoiceGroup(id);
  revalidatePath("/sales");
  revalidatePath("/invoices");
  redirect("/invoices");
}

export type RemoveSaleFromInvoiceActionResult =
  | { ok: true; groupDeleted: boolean; invoiceGroupId: string }
  | { ok: false; error: string };

export async function removeSaleFromInvoiceGroupAction(
  saleId: string,
): Promise<RemoveSaleFromInvoiceActionResult> {
  await ensureAuthenticated();

  try {
    const result = await removeSaleFromInvoiceGroup(saleId);
    revalidatePath("/sales");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${result.invoiceGroupId}`);

    return {
      ok: true,
      groupDeleted: result.groupDeleted,
      invoiceGroupId: result.invoiceGroupId,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal melepas penjualan dari invoice.",
    };
  }
}

const updatePaymentSchema = z.object({
  invoiceGroupId: formDataRequiredString("Invoice tidak valid."),
  paidAmount: z.coerce.number().min(0),
});

export async function updateInvoiceGroupPaymentAction(formData: FormData) {
  await ensureAuthenticated();

  const parsed = updatePaymentSchema.parse({
    invoiceGroupId: formData.get("invoiceGroupId"),
    paidAmount: formData.get("paidAmount"),
  });

  await updateInvoiceGroup(parsed.invoiceGroupId, {
    paidAmount: parsed.paidAmount,
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${parsed.invoiceGroupId}`);
  revalidatePath("/sales");
}

const recordPaymentSchema = z.object({
  invoiceGroupId: z.string().min(1),
  paymentDate: z.string().min(1, "Tanggal pelunasan wajib diisi."),
  amount: z.coerce.number().positive("Jumlah pelunasan wajib lebih dari 0."),
  notes: formDataOptionalString(),
});

export type RecordInvoiceGroupPaymentActionResult =
  | {
      ok: true;
      paidAmount: number;
      remainingAmount: number;
      paymentStatus: string;
    }
  | { ok: false; error: string };

export async function recordInvoiceGroupPaymentAction(
  input: z.infer<typeof recordPaymentSchema>,
): Promise<RecordInvoiceGroupPaymentActionResult> {
  await ensureAuthenticated();

  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  try {
    const group = await recordInvoiceGroupPayment({
      invoiceGroupId: parsed.data.invoiceGroupId,
      paymentDate: new Date(parsed.data.paymentDate),
      amount: parsed.data.amount,
      notes: parsed.data.notes,
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${parsed.data.invoiceGroupId}`);
    revalidatePath("/sales");

    return {
      ok: true,
      paidAmount: Number(group.paidAmount),
      remainingAmount: Number(group.remainingAmount),
      paymentStatus: group.paymentStatus,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal mencatat pelunasan.",
    };
  }
}
