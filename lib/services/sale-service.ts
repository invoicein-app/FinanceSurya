import type { Prisma } from "@prisma/client";

import { parseThicknessMmForStock } from "@/lib/sales/thickness-mm";
import { upsertCustomerPriceListFromSaleLines } from "@/lib/services/customer-price-list-service";
import { prisma } from "@/lib/prisma";

export type CreateSaleItemInput = {
  itemName: string;
  category?: string;
  thickness?: string;
  width?: string;
  length?: string;
  unit?: string;
  qty: number;
  price: number;
  note?: string;
  sources: Array<{
    /** Pilih partai saja — ketebalan & qty diambil dari kolom item. */
    woodPurchaseId?: string;
    /** Alokasi lama: baris WoodPurchaseItem (log/kapling). */
    purchaseItemId?: string;
    /** Payload lama: ID baris stok ketebalan + qtyTaken manual (masih didukung). */
    thicknessStockId?: string;
    qtyTaken?: number;
    volumeTaken?: number;
    costAmount?: number;
  }>;
};

export type CreateSaleInput = {
  saleDate: Date;
  customerId?: string;
  note?: string;
  items: CreateSaleItemInput[];
};

export type UpdateSaleInput = CreateSaleInput;

export async function getSales() {
  return prisma.sale.findMany({
    orderBy: { saleDate: "desc" },
    include: {
      customer: true,
      saleItems: {
        include: { sources: true },
      },
    },
  });
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      saleItems: {
        orderBy: { createdAt: "asc" },
        include: {
          sources: {
            include: {
              purchaseItem: {
                include: {
                  purchase: true,
                },
              },
              thicknessStock: {
                include: {
                  purchase: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function createSale(input: CreateSaleInput) {
  if (input.items.length === 0) {
    throw new Error("Minimal satu item penjualan wajib diisi.");
  }

  const normalizedItems = normalizeSaleItems(input.items);

  const grandTotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);

  return prisma.$transaction(async (tx) => {
    const customer = input.customerId
      ? await tx.customer.findUnique({
          where: { id: input.customerId },
        })
      : null;

    if (!customer && input.customerId) {
      throw new Error("Customer tidak ditemukan.");
    }

    const sale = await tx.sale.create({
      data: {
        saleDate: input.saleDate,
        customerId: customer?.id,
        customerName: customer?.name,
        note: input.note,
        grandTotal: grandTotal.toString(),
      },
    });

    for (const item of normalizedItems) {
      const createdSaleItem = await tx.saleItem.create({
        data: {
          saleId: sale.id,
          itemName: item.itemName,
          category: item.category ?? null,
          thickness: item.thickness ?? null,
          width: item.width ?? null,
          length: item.length ?? null,
          unit: item.unit ?? null,
          qty: item.qty.toString(),
          price: item.price.toString(),
          subtotal: item.subtotal.toString(),
          note: item.note || null,
        },
      });

      for (const source of item.sources) {
        const row = await resolveSourceToPersistedRow(tx, item, source);
        await applySaleSourceDeduction(tx, row);
        await tx.saleItemSource.create({
          data: {
            saleItemId: createdSaleItem.id,
            purchaseItemId: row.purchaseItemId,
            thicknessStockId: row.thicknessStockId,
            qtyTaken: row.qtyTaken.toString(),
            volumeTaken: row.volumeTaken.toString(),
            costAmount: row.costAmount.toString(),
          },
        });
      }
    }

    if (customer?.id) {
      await upsertCustomerPriceListFromSaleLines(tx, {
        customerId: customer.id,
        saleDate: input.saleDate,
        lines: normalizedItems.map((item) => ({
          itemName: item.itemName,
          category: item.category,
          thickness: item.thickness,
          width: item.width,
          length: item.length,
          unit: item.unit,
          price: item.price,
        })),
      });
    }

    return sale;
  });
}

export async function updateSale(id: string, input: UpdateSaleInput) {
  if (input.items.length === 0) {
    throw new Error("Minimal satu item penjualan wajib diisi.");
  }

  const normalizedItems = normalizeSaleItems(input.items);
  const grandTotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);

  return prisma.$transaction(async (tx) => {
    const customer = input.customerId
      ? await tx.customer.findUnique({
          where: { id: input.customerId },
        })
      : null;

    if (!customer && input.customerId) {
      throw new Error("Customer tidak ditemukan.");
    }

    const existingSaleItems = await tx.saleItem.findMany({
      where: { saleId: id },
      include: {
        sources: true,
      },
    });

    for (const saleItem of existingSaleItems) {
      for (const source of saleItem.sources) {
        await rollbackSaleSourceDeduction(tx, source);
      }
    }

    await tx.saleItemSource.deleteMany({
      where: {
        saleItem: {
          saleId: id,
        },
      },
    });

    await tx.saleItem.deleteMany({
      where: { saleId: id },
    });

    await tx.sale.update({
      where: { id },
      data: {
        saleDate: input.saleDate,
        customerId: customer?.id,
        customerName: customer?.name,
        note: input.note,
        grandTotal: grandTotal.toString(),
      },
    });

    for (const item of normalizedItems) {
      const createdSaleItem = await tx.saleItem.create({
        data: {
          saleId: id,
          itemName: item.itemName,
          category: item.category ?? null,
          thickness: item.thickness ?? null,
          width: item.width ?? null,
          length: item.length ?? null,
          unit: item.unit ?? null,
          qty: item.qty.toString(),
          price: item.price.toString(),
          subtotal: item.subtotal.toString(),
          note: item.note || null,
        },
      });

      for (const source of item.sources) {
        const row = await resolveSourceToPersistedRow(tx, item, source);
        await applySaleSourceDeduction(tx, row);
        await tx.saleItemSource.create({
          data: {
            saleItemId: createdSaleItem.id,
            purchaseItemId: row.purchaseItemId,
            thicknessStockId: row.thicknessStockId,
            qtyTaken: row.qtyTaken.toString(),
            volumeTaken: row.volumeTaken.toString(),
            costAmount: row.costAmount.toString(),
          },
        });
      }
    }

    if (customer?.id) {
      await upsertCustomerPriceListFromSaleLines(tx, {
        customerId: customer.id,
        saleDate: input.saleDate,
        lines: normalizedItems.map((item) => ({
          itemName: item.itemName,
          category: item.category,
          thickness: item.thickness,
          width: item.width,
          length: item.length,
          unit: item.unit,
          price: item.price,
        })),
      });
    }

    return tx.sale.findUnique({
      where: { id },
      include: {
        saleItems: true,
      },
    });
  });
}

type SaleItemSourceNormalized =
  | { kind: "partai"; woodPurchaseId: string }
  | { kind: "thickness_direct"; thicknessStockId: string; qtyTaken: number }
  | {
      kind: "legacy";
      purchaseItemId: string;
      qtyTaken: number;
      volumeTaken: number;
      costAmount: number;
    };

type NormalizedSaleLine = {
  itemName: string;
  category?: string;
  thickness?: string;
  width?: string;
  length?: string;
  unit?: string;
  qty: number;
  price: number;
  note?: string;
  subtotal: number;
  sources: SaleItemSourceNormalized[];
};

type PersistedSourceRow = {
  purchaseItemId: string | null;
  thicknessStockId: string | null;
  qtyTaken: number;
  volumeTaken: number;
  costAmount: number;
};

async function resolveSourceToPersistedRow(
  tx: Prisma.TransactionClient,
  item: Pick<NormalizedSaleLine, "itemName" | "thickness" | "qty">,
  source: SaleItemSourceNormalized,
): Promise<PersistedSourceRow> {
  if (source.kind === "legacy") {
    return {
      purchaseItemId: source.purchaseItemId,
      thicknessStockId: null,
      qtyTaken: source.qtyTaken,
      volumeTaken: source.volumeTaken,
      costAmount: source.costAmount,
    };
  }

  if (source.kind === "thickness_direct") {
    const row = await tx.woodPurchaseThicknessStock.findUnique({
      where: { id: source.thicknessStockId },
      include: { purchase: true },
    });
    if (!row) {
      throw new Error("Baris stok ketebalan tidak ditemukan.");
    }
    const available = Number(row.qtyAvailable);
    if (available < source.qtyTaken) {
      throw new Error(
        `Stok tidak cukup untuk batch ${row.purchase.batchCode}, ketebalan ${row.thicknessMm} mm: tersisa ${available}, dibutuhkan ${source.qtyTaken}.`,
      );
    }
    return {
      purchaseItemId: null,
      thicknessStockId: source.thicknessStockId,
      qtyTaken: source.qtyTaken,
      volumeTaken: 0,
      costAmount: 0,
    };
  }

  const mm = parseThicknessMmForStock(item.thickness);
  if (!mm) {
    throw new Error(
      `Isi kolom Tebal (mm) pada item "${item.itemName}" agar pengurangan stok partai bisa dilakukan.`,
    );
  }

  const row = await tx.woodPurchaseThicknessStock.findUnique({
    where: {
      purchaseId_thicknessMm: {
        purchaseId: source.woodPurchaseId,
        thicknessMm: mm,
      },
    },
    include: { purchase: true },
  });

  if (!row) {
    throw new Error(
      `Partai tidak memiliki stok untuk ketebalan ${mm} mm. Tambahkan baris stok di detail partai atau sesuaikan kolom Tebal.`,
    );
  }

  const available = Number(row.qtyAvailable);
  if (available < item.qty) {
    throw new Error(
      `Stok tidak cukup untuk batch ${row.purchase.batchCode}, ketebalan ${mm} mm: tersisa ${available}, dibutuhkan ${item.qty}.`,
    );
  }

  return {
    purchaseItemId: null,
    thicknessStockId: row.id,
    qtyTaken: item.qty,
    volumeTaken: 0,
    costAmount: 0,
  };
}

type DeductionSource = {
  purchaseItemId: string | null;
  thicknessStockId: string | null;
  qtyTaken: number;
  volumeTaken: number;
  costAmount: number;
};

async function applySaleSourceDeduction(tx: Prisma.TransactionClient, source: DeductionSource) {
  if (source.thicknessStockId) {
    const row = await tx.woodPurchaseThicknessStock.findUnique({
      where: { id: source.thicknessStockId },
    });
    if (!row) {
      throw new Error("Baris stok ketebalan tidak ditemukan.");
    }
    await tx.woodPurchaseThicknessStock.update({
      where: { id: source.thicknessStockId },
      data: {
        qtyAvailable: {
          decrement: source.qtyTaken.toString(),
        },
      },
    });
    return;
  }

  if (source.purchaseItemId) {
    await tx.woodPurchaseItem.update({
      where: { id: source.purchaseItemId },
      data: {
        remainingQty: {
          decrement: source.qtyTaken.toString(),
        },
        remainingVolume: {
          decrement: source.volumeTaken.toString(),
        },
      },
    });
  }
}

async function rollbackSaleSourceDeduction(
  tx: Prisma.TransactionClient,
  source: { thicknessStockId: string | null; purchaseItemId: string | null; qtyTaken: unknown; volumeTaken: unknown },
) {
  if (source.thicknessStockId) {
    await tx.woodPurchaseThicknessStock.update({
      where: { id: source.thicknessStockId },
      data: {
        qtyAvailable: {
          increment: Number(source.qtyTaken).toString(),
        },
      },
    });
    return;
  }
  if (source.purchaseItemId) {
    await tx.woodPurchaseItem.update({
      where: { id: source.purchaseItemId },
      data: {
        remainingQty: {
          increment: Number(source.qtyTaken).toString(),
        },
        remainingVolume: {
          increment: Number(source.volumeTaken).toString(),
        },
      },
    });
  }
}

function normalizeSaleItems(items: CreateSaleItemInput[]): NormalizedSaleLine[] {
  const normalizedItems = items
    .map((item) => {
      const itemName = item.itemName.trim();
      if (!itemName) {
        throw new Error("Nama item wajib diisi.");
      }
      if (item.qty <= 0) {
        throw new Error("Qty harus lebih dari 0.");
      }
      if (item.price < 0) {
        throw new Error("Harga tidak boleh negatif.");
      }

      const parsedSources: SaleItemSourceNormalized[] = [];
      let partaiAdded = false;

      for (const src of item.sources) {
        const wood = src.woodPurchaseId?.trim();
        const leg = src.purchaseItemId?.trim();
        const tid = src.thicknessStockId?.trim();
        const qtyTaken = Number(src.qtyTaken || 0);
        const vol = Number(src.volumeTaken || 0);
        const cost = Number(src.costAmount || 0);

        if (leg && !tid) {
          if (qtyTaken > 0 || vol > 0) {
            parsedSources.push({
              kind: "legacy",
              purchaseItemId: leg,
              qtyTaken,
              volumeTaken: vol,
              costAmount: cost,
            });
          }
          continue;
        }

        if (wood) {
          if (leg || tid) {
            throw new Error(
              "Sumber partai (baru) tidak boleh digabung purchaseItemId/thicknessStockId pada baris yang sama.",
            );
          }
          if (!partaiAdded) {
            partaiAdded = true;
            parsedSources.push({ kind: "partai", woodPurchaseId: wood });
          }
          continue;
        }

        if (tid && !leg && qtyTaken > 0) {
          parsedSources.push({
            kind: "thickness_direct",
            thicknessStockId: tid,
            qtyTaken,
          });
        }
      }

      const hasPartai = parsedSources.some((s) => s.kind === "partai");
      const hasLegacy = parsedSources.some((s) => s.kind === "legacy");
      const hasThickDirect = parsedSources.some((s) => s.kind === "thickness_direct");

      if (hasPartai && hasLegacy) {
        throw new Error(
          "Satu item tidak boleh sekaligus memakai alokasi partai (model baru) dan alokasi log lama.",
        );
      }

      if (hasPartai && hasThickDirect) {
        throw new Error("Satu item tidak boleh memakai lebih dari satu jenis alokasi stok ketebalan.");
      }

      const category = item.category?.trim() || undefined;
      const thickness = item.thickness?.trim() || undefined;
      const width = item.width?.trim() || undefined;
      const length = item.length?.trim() || undefined;
      const unit = item.unit?.trim() || undefined;

      return {
        itemName,
        category,
        thickness,
        width,
        length,
        unit,
        qty: item.qty,
        price: item.price,
        note: item.note,
        subtotal: item.qty * item.price,
        sources: parsedSources,
      };
    })
    .filter((item) => item.itemName.length > 0);

  return normalizedItems;
}
