import { Prisma, type InvoicePaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const DUPLICATE_INVOICE_CODE_MESSAGE =
  "Kode invoice sudah dipakai. Gunakan kode lain yang belum terdaftar.";

export const SALE_ALREADY_IN_INVOICE_MESSAGE =
  "Beberapa penjualan sudah masuk invoice group lain dan tidak bisa dipilih lagi.";

export const MIXED_CUSTOMER_INVOICE_MESSAGE =
  "Semua penjualan yang dipilih harus dari customer yang sama.";

export const SALE_NOT_IN_INVOICE_MESSAGE =
  "Penjualan ini tidak terhubung ke invoice group.";

export function computePaymentStatus(
  paidAmount: number,
  totalAmount: number,
): InvoicePaymentStatus {
  if (totalAmount <= 0) {
    return paidAmount > 0 ? "paid" : "unpaid";
  }
  if (paidAmount <= 0) {
    return "unpaid";
  }
  if (paidAmount >= totalAmount) {
    return "paid";
  }
  return "partial";
}

export function paymentStatusLabel(status: InvoicePaymentStatus | string): string {
  switch (status) {
    case "paid":
      return "Lunas";
    case "partial":
      return "Partial";
    default:
      return "Belum lunas";
  }
}

export function paymentStatusBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "border-primary/25 bg-primary/10 text-primary";
    case "partial":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
    default:
      return "border-destructive/25 bg-destructive/10 text-destructive";
  }
}

export type CreateInvoiceGroupInput = {
  saleIds: string[];
  manualInvoiceCode: string;
  invoiceDate: Date;
  notes?: string;
};

export type UpdateInvoiceGroupInput = {
  manualInvoiceCode?: string;
  invoiceDate?: Date;
  notes?: string;
  paidAmount?: number;
};

export type InvoiceGroupListFilters = {
  code?: string;
  customerId?: string;
  paymentStatus?: InvoicePaymentStatus;
};

async function sumSalesTotal(invoiceGroupId: string): Promise<number> {
  const sales = await prisma.sale.findMany({
    where: { invoiceGroupId },
    select: { grandTotal: true },
  });
  return sales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
}

function buildPaymentFields(totalAmount: number, paidAmount: number) {
  const normalizedPaid = Math.max(paidAmount, 0);
  const remainingAmount = Math.max(totalAmount - normalizedPaid, 0);
  const paymentStatus = computePaymentStatus(normalizedPaid, totalAmount);

  return {
    totalAmount: totalAmount.toFixed(2),
    paidAmount: normalizedPaid.toFixed(2),
    remainingAmount: remainingAmount.toFixed(2),
    paymentStatus,
  };
}

export async function getInvoiceGroups(filters?: InvoiceGroupListFilters) {
  const code = filters?.code?.trim();

  return prisma.invoiceGroup.findMany({
    where: {
      ...(code
        ? {
            manualInvoiceCode: {
              contains: code,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
      ...(filters?.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    },
    orderBy: { invoiceDate: "desc" },
    include: {
      customer: true,
      _count: { select: { sales: true } },
    },
  });
}

const saleWithPartaiInclude = {
  orderBy: { saleDate: "asc" as const },
  include: {
    saleItems: {
      orderBy: { createdAt: "asc" as const },
      include: {
        sources: {
          include: {
            purchaseItem: {
              include: { purchase: true },
            },
            thicknessStock: {
              include: { purchase: true },
            },
          },
        },
      },
    },
  },
};

export async function getInvoiceGroupById(id: string) {
  return prisma.invoiceGroup.findUnique({
    where: { id },
    include: {
      customer: true,
      sales: saleWithPartaiInclude,
    },
  });
}

export async function createInvoiceGroup(input: CreateInvoiceGroupInput) {
  const manualInvoiceCode = input.manualInvoiceCode.trim();
  if (!manualInvoiceCode) {
    throw new Error("Kode invoice wajib diisi.");
  }

  const saleIds = [...new Set(input.saleIds.map((id) => id.trim()).filter(Boolean))];
  if (saleIds.length < 1) {
    throw new Error("Pilih minimal 1 penjualan untuk digabung.");
  }

  const sales = await prisma.sale.findMany({
    where: { id: { in: saleIds } },
    include: { customer: true },
  });

  if (sales.length !== saleIds.length) {
    throw new Error("Beberapa penjualan tidak ditemukan.");
  }

  const alreadyGrouped = sales.filter((sale) => sale.invoiceGroupId);
  if (alreadyGrouped.length > 0) {
    throw new Error(SALE_ALREADY_IN_INVOICE_MESSAGE);
  }

  const customerIds = new Set(
    sales.map((sale) => sale.customerId).filter((id): id is string => Boolean(id)),
  );
  if (customerIds.size !== 1) {
    throw new Error(MIXED_CUSTOMER_INVOICE_MESSAGE);
  }

  const customerId = [...customerIds][0]!;
  const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
  const paymentFields = buildPaymentFields(totalAmount, 0);

  try {
    return await prisma.$transaction(async (tx) => {
      const group = await tx.invoiceGroup.create({
        data: {
          customerId,
          manualInvoiceCode,
          invoiceDate: input.invoiceDate,
          notes: input.notes?.trim() || null,
          ...paymentFields,
        },
      });

      await tx.sale.updateMany({
        where: { id: { in: saleIds } },
        data: { invoiceGroupId: group.id },
      });

      return group;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(DUPLICATE_INVOICE_CODE_MESSAGE);
    }
    throw error;
  }
}

export async function updateInvoiceGroup(id: string, input: UpdateInvoiceGroupInput) {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("ID invoice group tidak valid.");
  }

  const group = await prisma.invoiceGroup.findUnique({ where: { id: trimmedId } });
  if (!group) {
    throw new Error("Invoice group tidak ditemukan.");
  }

  const totalAmount = await sumSalesTotal(trimmedId);

  const manualInvoiceCode =
    input.manualInvoiceCode !== undefined
      ? input.manualInvoiceCode.trim()
      : group.manualInvoiceCode;
  if (!manualInvoiceCode) {
    throw new Error("Kode invoice wajib diisi.");
  }

  if (manualInvoiceCode !== group.manualInvoiceCode) {
    const duplicate = await prisma.invoiceGroup.findUnique({
      where: { manualInvoiceCode },
      select: { id: true },
    });
    if (duplicate && duplicate.id !== trimmedId) {
      throw new Error(DUPLICATE_INVOICE_CODE_MESSAGE);
    }
  }

  const paidAmount =
    input.paidAmount !== undefined ? input.paidAmount : Number(group.paidAmount);
  if (paidAmount < 0) {
    throw new Error("Jumlah pembayaran tidak boleh negatif.");
  }

  const paymentFields = buildPaymentFields(totalAmount, paidAmount);

  try {
    return await prisma.invoiceGroup.update({
      where: { id: trimmedId },
      data: {
        manualInvoiceCode,
        invoiceDate: input.invoiceDate ?? group.invoiceDate,
        notes:
          input.notes !== undefined ? input.notes.trim() || null : group.notes,
        ...paymentFields,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(DUPLICATE_INVOICE_CODE_MESSAGE);
    }
    throw error;
  }
}

export async function updateInvoiceGroupPayment(id: string, paidAmount: number) {
  return updateInvoiceGroup(id, { paidAmount });
}

export async function deleteInvoiceGroup(id: string) {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("ID invoice group tidak valid.");
  }

  const existing = await prisma.invoiceGroup.findUnique({
    where: { id: trimmedId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Invoice group tidak ditemukan.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.updateMany({
      where: { invoiceGroupId: trimmedId },
      data: { invoiceGroupId: null },
    });
    await tx.invoiceGroup.delete({ where: { id: trimmedId } });
  });
}

export async function removeSaleFromInvoiceGroup(saleId: string) {
  const trimmedSaleId = saleId.trim();
  if (!trimmedSaleId) {
    throw new Error("ID penjualan tidak valid.");
  }

  const sale = await prisma.sale.findUnique({
    where: { id: trimmedSaleId },
    select: { id: true, invoiceGroupId: true },
  });

  if (!sale) {
    throw new Error("Penjualan tidak ditemukan.");
  }
  if (!sale.invoiceGroupId) {
    throw new Error(SALE_NOT_IN_INVOICE_MESSAGE);
  }

  const invoiceGroupId = sale.invoiceGroupId;

  await prisma.sale.update({
    where: { id: trimmedSaleId },
    data: { invoiceGroupId: null },
  });

  const remaining = await prisma.sale.count({
    where: { invoiceGroupId },
  });

  if (remaining === 0) {
    await prisma.invoiceGroup.delete({ where: { id: invoiceGroupId } });
    return { invoiceGroupId, groupDeleted: true };
  }

  await recalculateInvoiceGroupTotals(invoiceGroupId);
  return { invoiceGroupId, groupDeleted: false };
}

export async function recalculateInvoiceGroupTotals(invoiceGroupId: string) {
  const trimmedId = invoiceGroupId.trim();
  const group = await prisma.invoiceGroup.findUnique({ where: { id: trimmedId } });
  if (!group) {
    return null;
  }

  const totalAmount = await sumSalesTotal(trimmedId);
  const paidAmount = Number(group.paidAmount);
  const paymentFields = buildPaymentFields(totalAmount, paidAmount);

  return prisma.invoiceGroup.update({
    where: { id: trimmedId },
    data: paymentFields,
  });
}
