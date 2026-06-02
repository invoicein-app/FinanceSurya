import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Ketebalan standar veneer per partai (mm) — otomatis dibuat dengan qty 0. */
export const DEFAULT_PARTAI_THICKNESS_MM = ["0.6", "1.2"] as const;

/** Satuan default untuk stok veneer per ketebalan (qty mengacu ke unit ini). */
export const DEFAULT_THICKNESS_STOCK_UNIT = "m2";

async function ensureDefaultThicknessStockRows(
  tx: Prisma.TransactionClient,
  purchaseId: string,
) {
  await tx.woodPurchaseThicknessStock.createMany({
    data: DEFAULT_PARTAI_THICKNESS_MM.map((thicknessMm) => ({
      purchaseId,
      thicknessMm,
      qtyAvailable: "0",
      unit: DEFAULT_THICKNESS_STOCK_UNIT,
    })),
    skipDuplicates: true,
  });
}

export type WoodPurchaseItemInput = {
  id?: string;
  woodType: string;
  length?: number;
  diameter?: number;
  logQty: number;
  volume: number;
  mutu?: string;
  note?: string;
};

export type CreateWoodPurchaseInput = {
  clientRequestId?: string;
  vendorId: string;
  purchaseDate: Date;
  batchCode: string;
  documentNumber?: string;
  note?: string;
  bpCost: number;
  cuttingCost: number;
  shippingCost: number;
  woodPrice: number;
  grandTotal: number;
  items: WoodPurchaseItemInput[];
};

export type UpdateWoodPurchaseInput = CreateWoodPurchaseInput;

/** Σ WoodPurchaseItem.volume per partai — satu baris dihitung sekali; tanpa detail = 0. */
export function sumWoodPurchaseDetailVolume(items: Array<{ volume: unknown }>): number {
  return items.reduce((sum, row) => sum + Number(row.volume ?? 0), 0);
}

export async function getWoodPurchases() {
  return prisma.woodPurchase.findMany({
    orderBy: { purchaseDate: "desc" },
    include: {
      vendor: true,
      items: true,
    },
  });
}

export async function getWoodPurchaseById(id: string) {
  const purchase = await prisma.woodPurchase.findUnique({
    where: { id },
    include: {
      vendor: true,
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!purchase) {
    return null;
  }
  // Loaded separately so a slightly stale Prisma client (missing relation on WoodPurchase include)
  // still works after `npx prisma generate`. Always regenerate the client after schema changes.
  const thicknessStocks = await prisma.woodPurchaseThicknessStock.findMany({
    where: { purchaseId: id },
    orderBy: { thicknessMm: "asc" },
  });
  return { ...purchase, thicknessStocks };
}

export async function getPurchaseItemSources() {
  return prisma.woodPurchaseItem.findMany({
    orderBy: [{ purchase: { purchaseDate: "desc" } }, { createdAt: "asc" }],
    include: {
      purchase: true,
    },
  });
}

export type ThicknessStockOption = {
  id: string;
  purchaseId: string;
  batchCode: string;
  thicknessMm: string;
  /** Sisa stok yang boleh diambil dari form (termasuk pengembalian virtual saat edit penjualan). */
  qtyAvailableEffective: number;
  unit: string | null;
};

/**
 * Opsi alokasi penjualan per partai + ketebalan.
 * `adjustmentsFromSaleId`: saat edit, tambahkan qty yang sudah dialokasikan penjualan ini ke stok tampilan agar validasi UI konsisten sebelum rollback server.
 */
export async function getThicknessStockOptionsForSaleForm(options?: {
  adjustmentsFromSaleId?: string;
}): Promise<ThicknessStockOption[]> {
  const rows = await prisma.woodPurchaseThicknessStock.findMany({
    orderBy: [{ purchase: { purchaseDate: "desc" } }, { thicknessMm: "asc" }],
    include: { purchase: true },
  });

  let bonusByStockId = new Map<string, number>();
  if (options?.adjustmentsFromSaleId) {
    const sources = await prisma.saleItemSource.findMany({
      where: {
        thicknessStockId: { not: null },
        saleItem: { saleId: options.adjustmentsFromSaleId },
      },
      select: { thicknessStockId: true, qtyTaken: true },
    });
    bonusByStockId = sources.reduce((map, s) => {
      if (!s.thicknessStockId) {
        return map;
      }
      const add = Number(s.qtyTaken);
      map.set(s.thicknessStockId, (map.get(s.thicknessStockId) ?? 0) + add);
      return map;
    }, new Map<string, number>());
  }

  return rows.map((row) => {
    const base = Number(row.qtyAvailable);
    const bonus = bonusByStockId.get(row.id) ?? 0;
    return {
      id: row.id,
      purchaseId: row.purchaseId,
      batchCode: row.purchase.batchCode,
      thicknessMm: row.thicknessMm.toString(),
      qtyAvailableEffective: base + bonus,
      unit: row.unit,
    };
  });
}

export async function createThicknessStockRow(input: {
  purchaseId: string;
  thicknessMm: number;
  qtyInitial: number;
  unit?: string | null;
}) {
  if (input.thicknessMm <= 0 || Number.isNaN(input.thicknessMm)) {
    throw new Error("Ketebalan (mm) harus lebih dari 0.");
  }
  if (input.qtyInitial < 0) {
    throw new Error("Qty awal tidak boleh negatif.");
  }

  const unit = input.unit?.trim() || DEFAULT_THICKNESS_STOCK_UNIT;

  return prisma.woodPurchaseThicknessStock.create({
    data: {
      purchaseId: input.purchaseId,
      thicknessMm: input.thicknessMm.toString(),
      qtyAvailable: input.qtyInitial.toString(),
      unit,
    },
  });
}

export async function deleteWoodPurchase(id: string) {
  const purchase = await prisma.woodPurchase.findUnique({
    where: { id },
    include: {
      items: { select: { id: true } },
      thicknessStocks: { select: { id: true } },
    },
  });

  if (!purchase) {
    throw new Error("Data partai tidak ditemukan.");
  }

  const itemIds = purchase.items.map((item) => item.id);
  const stockIds = purchase.thicknessStocks.map((stock) => stock.id);
  const saleLinkConditions: Prisma.SaleItemSourceWhereInput[] = [];

  if (itemIds.length > 0) {
    saleLinkConditions.push({ purchaseItemId: { in: itemIds } });
  }
  if (stockIds.length > 0) {
    saleLinkConditions.push({ thicknessStockId: { in: stockIds } });
  }

  if (saleLinkConditions.length > 0) {
    const linkedSaleSource = await prisma.saleItemSource.findFirst({
      where: { OR: saleLinkConditions },
      select: { id: true },
    });

    if (linkedSaleSource) {
      throw new Error(
        "Tidak bisa menghapus partai ini karena masih dipakai di transaksi penjualan. Hapus atau ubah alokasi penjualan terkait terlebih dahulu.",
      );
    }
  }

  try {
    await prisma.woodPurchase.delete({ where: { id } });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2003") {
      throw new Error("Tidak bisa menghapus partai karena masih direferensikan data lain.");
    }
    throw error;
  }
}

export async function deleteThicknessStockRow(id: string) {
  const row = await prisma.woodPurchaseThicknessStock.findUnique({
    where: { id },
    include: { saleSources: { take: 1 } },
  });
  if (!row) {
    throw new Error("Baris stok tidak ditemukan.");
  }
  if (row.saleSources.length > 0) {
    throw new Error("Tidak bisa menghapus stok yang pernah dipakai alokasi penjualan.");
  }
  try {
    await prisma.woodPurchaseThicknessStock.delete({ where: { id } });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2003") {
      throw new Error("Tidak bisa menghapus stok karena masih direferensikan data penjualan.");
    }
    throw error;
  }
}

export async function createWoodPurchase(input: CreateWoodPurchaseInput) {
  const normalizedItems = normalizePurchaseItems(input.items);
  const calculatedGrandTotal = calculateGrandTotal(input);
  const requestKey = input.clientRequestId?.trim();

  if (requestKey) {
    const existing = await prisma.woodPurchase.findUnique({
      where: { clientRequestId: requestKey },
    });
    if (existing) {
      return existing;
    }
  }

  return prisma.$transaction(async (tx) => {
    let purchase;
    try {
      purchase = await tx.woodPurchase.create({
        data: {
          clientRequestId: requestKey || null,
          vendorId: input.vendorId,
          purchaseDate: input.purchaseDate,
          batchCode: input.batchCode,
          documentNumber: input.documentNumber,
          note: input.note,
          bpCost: input.bpCost.toString(),
          cuttingCost: input.cuttingCost.toString(),
          shippingCost: input.shippingCost.toString(),
          woodPrice: input.woodPrice.toString(),
          grandTotal: calculatedGrandTotal.toString(),
        },
      });
    } catch (error) {
      if (
        requestKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await prisma.woodPurchase.findUnique({
          where: { clientRequestId: requestKey },
        });
        if (existing) {
          return existing;
        }
      }
      throw error;
    }

    await tx.woodPurchaseItem.createMany({
      data: normalizedItems.map((item, index) => ({
        purchaseId: purchase.id,
        noKapling: `AUTO-${String(index + 1).padStart(3, "0")}`,
        woodType: item.woodType,
        sort: null,
        length: toDecimalOrNull(item.length),
        diameter: toDecimalOrNull(item.diameter),
        logQty: item.logQty.toString(),
        volume: item.volume.toString(),
        mutu: item.mutu || null,
        status: null,
        amount: "0",
        remainingQty: item.logQty.toString(),
        remainingVolume: item.volume.toString(),
        note: item.note || null,
      })),
    });

    await ensureDefaultThicknessStockRows(tx, purchase.id);

    return purchase;
  });
}

export async function updateWoodPurchase(id: string, input: UpdateWoodPurchaseInput) {
  const normalizedItems = normalizePurchaseItems(input.items);
  const calculatedGrandTotal = calculateGrandTotal(input);

  return prisma.$transaction(async (tx) => {
    await tx.woodPurchase.update({
      where: { id },
      data: {
        vendorId: input.vendorId,
        purchaseDate: input.purchaseDate,
        batchCode: input.batchCode,
        documentNumber: input.documentNumber,
        note: input.note,
        bpCost: input.bpCost.toString(),
        cuttingCost: input.cuttingCost.toString(),
        shippingCost: input.shippingCost.toString(),
        woodPrice: input.woodPrice.toString(),
        grandTotal: calculatedGrandTotal.toString(),
      },
    });

    const existingItems = await tx.woodPurchaseItem.findMany({
      where: { purchaseId: id },
      include: {
        saleSources: true,
      },
    });

    const submittedItemIds = new Set(normalizedItems.map((item) => item.id).filter(Boolean));
    const deletableItems = existingItems.filter((item) => item.saleSources.length === 0);
    for (const deletableItem of deletableItems) {
      if (submittedItemIds.has(deletableItem.id)) {
        continue;
      }
      await tx.woodPurchaseItem.delete({
        where: { id: deletableItem.id },
      });
    }

    for (const [index, item] of normalizedItems.entries()) {
      const existingItem = item.id
        ? existingItems.find((candidate) => candidate.id === item.id)
        : undefined;

      if (!existingItem) {
        await tx.woodPurchaseItem.create({
          data: {
            purchaseId: id,
            noKapling: `AUTO-${String(index + 1).padStart(3, "0")}`,
            woodType: item.woodType,
            sort: null,
            length: toDecimalOrNull(item.length),
            diameter: toDecimalOrNull(item.diameter),
            logQty: item.logQty.toString(),
            volume: item.volume.toString(),
            mutu: item.mutu || null,
            status: null,
            amount: "0",
            remainingQty: item.logQty.toString(),
            remainingVolume: item.volume.toString(),
            note: item.note || null,
          },
        });
        continue;
      }

      const usedQty = Number(existingItem.logQty) - Number(existingItem.remainingQty);
      const usedVolume = Number(existingItem.volume) - Number(existingItem.remainingVolume);

      await tx.woodPurchaseItem.update({
        where: { id: existingItem.id },
        data: {
          noKapling: existingItem.noKapling,
          woodType: item.woodType,
          sort: null,
          length: toDecimalOrNull(item.length),
          diameter: toDecimalOrNull(item.diameter),
          logQty: item.logQty.toString(),
          volume: item.volume.toString(),
          mutu: item.mutu || null,
          status: null,
          amount: "0",
          remainingQty: Math.max(item.logQty - usedQty, 0).toString(),
          remainingVolume: Math.max(item.volume - usedVolume, 0).toString(),
          note: item.note || null,
        },
      });
    }

    await ensureDefaultThicknessStockRows(tx, id);
  });
}

function normalizePurchaseItems(items: WoodPurchaseItemInput[]) {
  if (items.length === 0) {
    throw new Error("Minimal satu item pembelian wajib diisi.");
  }

  return items.map((item) => {
    const woodType = item.woodType.trim();
    if (!woodType) {
      throw new Error("Jenis kayu wajib diisi.");
    }
    if (item.logQty < 0 || item.volume < 0) {
      throw new Error("Qty/volume tidak boleh negatif.");
    }

    return {
      ...item,
      woodType,
    };
  });
}

function calculateGrandTotal(
  purchase: Pick<
    CreateWoodPurchaseInput,
    "bpCost" | "cuttingCost" | "shippingCost" | "woodPrice" | "grandTotal"
  >,
) {
  return purchase.bpCost + purchase.cuttingCost + purchase.shippingCost + purchase.woodPrice;
}

function toDecimalOrNull(value?: number) {
  return typeof value === "number" ? value.toString() : null;
}
