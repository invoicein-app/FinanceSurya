import { Prisma } from "@prisma/client";

import { formatPartaiLabel, type PartaiLabelInput } from "@/lib/partai/format-partai-label";
import { prisma } from "@/lib/prisma";
import { parseThicknessMmForStock, thicknessMmMatches } from "@/lib/sales/thickness-mm";

/** Ketebalan standar veneer per partai (mm) — otomatis dibuat dengan qty 0. */
export const DEFAULT_PARTAI_THICKNESS_MM = ["0.6", "1.2"] as const;

/** Satuan default untuk stok veneer per ketebalan (qty mengacu ke unit ini). */
export const DEFAULT_THICKNESS_STOCK_UNIT = "m2";

type WoodPurchaseDb = Pick<Prisma.TransactionClient, "woodPurchaseThicknessStock">;

async function ensureDefaultThicknessStockRows(
  tx: WoodPurchaseDb,
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
  batchYear?: number | null;
  woodSpecies?: string | null;
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

export type PartaiPurchaseAnalytics = {
  itemCount: number;
  totalLogQty: number;
  totalVolume: number;
  grandTotal: number;
  avgPricePerM3: number | null;
};

export type PartaiGradeOutputRow = {
  grade: string;
  qty: number;
  sharePercent: number;
};

export type PartaiLengthDistributionRow = {
  label: string;
  qty: number;
  sharePercent: number;
};

export type PartaiVeneerOutputAnalytics = {
  allocationCount: number;
  totalOutputQty: number;
  gradeRows: PartaiGradeOutputRow[];
  lengthRows: PartaiLengthDistributionRow[];
};

function normalizeVeneerGrade(category: string | null | undefined): string {
  const raw = String(category ?? "").trim();
  if (!raw) {
    return "Tanpa grade";
  }
  const upper = raw.toUpperCase();
  if (upper === "A" || upper === "B" || upper === "C") {
    return upper;
  }
  return raw;
}

function normalizeLengthCategory(length: string | null | undefined): string {
  const raw = String(length ?? "").trim();
  return raw.length > 0 ? raw : "(kosong)";
}

/** Metrik pembelian mentah dari baris `WoodPurchaseItem` (bukan hasil veneer). */
export function computePartaiPurchaseAnalytics(
  purchase: {
    grandTotal: unknown;
    items: Array<{ volume: unknown; logQty: unknown }>;
  },
): PartaiPurchaseAnalytics {
  const items = purchase.items;
  const totalVolume = sumWoodPurchaseDetailVolume(items);
  const grandTotal = Number(purchase.grandTotal ?? 0);
  const avgPricePerM3 = totalVolume > 0 ? grandTotal / totalVolume : null;
  const totalLogQty = items.reduce((sum, row) => sum + Number(row.logQty ?? 0), 0);

  return {
    itemCount: items.length,
    totalLogQty,
    totalVolume,
    grandTotal,
    avgPricePerM3,
  };
}

/**
 * Agregasi hasil veneer dari baris alokasi penjualan yang terhubung ke partai (`SaleItemSource` → item).
 * Grade dari `SaleItem.category` (Mutu A/B/C di form). Qty memakai `qtyTaken` per alokasi.
 */
export function aggregatePartaiVeneerOutputAnalytics(
  rows: Array<{
    qtyTaken: number;
    gradeLabel: string | null;
    lengthLabel: string | null;
  }>,
): PartaiVeneerOutputAnalytics {
  const gradeMap = new Map<string, number>();
  const lengthMap = new Map<string, number>();
  let totalOutputQty = 0;

  for (const row of rows) {
    const qty = Number(row.qtyTaken);
    if (qty <= 0) {
      continue;
    }
    totalOutputQty += qty;
    const grade = normalizeVeneerGrade(row.gradeLabel);
    gradeMap.set(grade, (gradeMap.get(grade) ?? 0) + qty);
    const lengthKey = normalizeLengthCategory(row.lengthLabel);
    lengthMap.set(lengthKey, (lengthMap.get(lengthKey) ?? 0) + qty);
  }

  const gradeRows: PartaiGradeOutputRow[] = Array.from(gradeMap.entries())
    .map(([grade, qty]) => ({
      grade,
      qty,
      sharePercent: totalOutputQty > 0 ? (qty / totalOutputQty) * 100 : 0,
    }))
    .sort((a, b) => {
      const order = ["A", "B", "C"];
      const ai = order.indexOf(a.grade);
      const bi = order.indexOf(b.grade);
      if (ai !== -1 && bi !== -1) {
        return ai - bi;
      }
      if (ai !== -1) {
        return -1;
      }
      if (bi !== -1) {
        return 1;
      }
      return b.qty - a.qty;
    });

  const lengthRows: PartaiLengthDistributionRow[] = Array.from(lengthMap.entries())
    .map(([label, qty]) => ({
      label,
      qty,
      sharePercent: totalOutputQty > 0 ? (qty / totalOutputQty) * 100 : 0,
    }))
    .sort((a, b) => b.qty - a.qty);

  return {
    allocationCount: rows.length,
    totalOutputQty,
    gradeRows,
    lengthRows,
  };
}

export type WoodPurchaseListFilters = {
  batchYear?: number;
  q?: string;
};

export function partaiLabelFromPurchase(
  purchase: PartaiLabelInput & { purchaseDate?: Date | string | null },
): string {
  return formatPartaiLabel(purchase);
}

export type WoodPurchaseListRow = Awaited<ReturnType<typeof fetchAllWoodPurchases>>[number];

async function fetchAllWoodPurchases() {
  return prisma.woodPurchase.findMany({
    orderBy: [{ batchYear: "desc" }, { purchaseDate: "desc" }, { batchCode: "asc" }],
    include: {
      vendor: true,
      items: true,
    },
  });
}

export function filterWoodPurchasesList(
  rows: WoodPurchaseListRow[],
  filters?: WoodPurchaseListFilters,
): WoodPurchaseListRow[] {
  let result = rows;

  if (filters?.batchYear != null && Number.isFinite(filters.batchYear)) {
    const year = filters.batchYear;
    result = result.filter((row) => {
      if (row.batchYear === year) {
        return true;
      }
      if (row.batchYear == null) {
        return new Date(row.purchaseDate).getFullYear() === year;
      }
      return false;
    });
  }

  const q = filters?.q?.trim().toLowerCase();
  if (q) {
    result = result.filter((row) => {
      const haystack = [
        row.batchCode,
        row.batchYear?.toString(),
        row.woodSpecies,
        row.vendor.name,
        formatPartaiLabel(row),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return result;
}

export async function getWoodPurchases(filters?: WoodPurchaseListFilters) {
  const rows = await fetchAllWoodPurchases();
  if (!filters?.batchYear && !filters?.q?.trim()) {
    return rows;
  }
  return filterWoodPurchasesList(rows, filters);
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

export type PartaiSaleUsageSourceKind = "thickness" | "legacy_log";

export type PartaiRelatedSaleUsageRow = {
  sourceId: string;
  saleId: string;
  saleDate: string;
  saleItemQty: number;
  customerLabel: string;
  canTransfer: boolean;
  itemName: string;
  unit: string | null;
  thicknessLabel: string;
  qtyTaken: number;
  volumeTaken: number;
  price: number;
  lineSubtotal: number;
  sourceKind: PartaiSaleUsageSourceKind;
  legacyKapling: string | null;
  sourceCreatedAt: string;
  /** Mutu/grade veneer (`SaleItem.category`, mis. A/B/C). */
  gradeLabel: string | null;
  /** Panjang veneer (`SaleItem.length`, teks/kategori). */
  lengthLabel: string | null;
};

export type PartaiRelatedSaleUsagesResult = {
  rows: PartaiRelatedSaleUsageRow[];
  summary: {
    allocationCount: number;
    uniqueSaleCount: number;
    totalQtyTaken: number;
    totalVolumeTaken: number;
    qtyByThickness: Record<string, number>;
  };
};

/**
 * Semua baris alokasi penjualan yang mengonsumsi partai ini (stok ketebalan atau log/kapling lama).
 */
export async function getPartaiRelatedSaleUsages(
  purchaseId: string,
): Promise<PartaiRelatedSaleUsagesResult> {
  const [stocks, items] = await Promise.all([
    prisma.woodPurchaseThicknessStock.findMany({
      where: { purchaseId },
      select: { id: true },
    }),
    prisma.woodPurchaseItem.findMany({
      where: { purchaseId },
      select: { id: true },
    }),
  ]);

  const stockIds = stocks.map((row) => row.id);
  const itemIds = items.map((row) => row.id);
  const saleLinkConditions: Prisma.SaleItemSourceWhereInput[] = [];

  if (stockIds.length > 0) {
    saleLinkConditions.push({ thicknessStockId: { in: stockIds } });
  }
  if (itemIds.length > 0) {
    saleLinkConditions.push({ purchaseItemId: { in: itemIds } });
  }

  const emptySummary = {
    allocationCount: 0,
    uniqueSaleCount: 0,
    totalQtyTaken: 0,
    totalVolumeTaken: 0,
    qtyByThickness: {} as Record<string, number>,
  };

  if (saleLinkConditions.length === 0) {
    return { rows: [], summary: emptySummary };
  }

  const sources = await prisma.saleItemSource.findMany({
    where: { OR: saleLinkConditions },
    include: {
      saleItem: {
        include: {
          sale: { include: { customer: true } },
        },
      },
      thicknessStock: true,
      purchaseItem: true,
    },
    orderBy: [
      { saleItem: { sale: { saleDate: "desc" } } },
      { createdAt: "desc" },
    ],
  });

  const qtyByThickness: Record<string, number> = {};
  const saleIds = new Set<string>();
  let totalQtyTaken = 0;
  let totalVolumeTaken = 0;

  const rows: PartaiRelatedSaleUsageRow[] = sources.map((source) => {
    const sale = source.saleItem.sale;
    const sourceKind: PartaiSaleUsageSourceKind = source.thicknessStockId
      ? "thickness"
      : "legacy_log";
    const thicknessLabel = source.thicknessStock
      ? source.thicknessStock.thicknessMm.toString()
      : (source.saleItem.thickness?.trim() || "—");
    const qtyTaken = Number(source.qtyTaken);
    const volumeTaken = Number(source.volumeTaken);

    saleIds.add(sale.id);
    totalQtyTaken += qtyTaken;
    totalVolumeTaken += volumeTaken;

    if (thicknessLabel !== "—" && qtyTaken > 0) {
      qtyByThickness[thicknessLabel] = (qtyByThickness[thicknessLabel] ?? 0) + qtyTaken;
    }

    const customerLabel =
      sale.customer?.name?.trim() || sale.customerName?.trim() || "—";

    return {
      sourceId: source.id,
      saleId: sale.id,
      saleDate: sale.saleDate.toISOString(),
      saleItemQty: Number(source.saleItem.qty),
      canTransfer: sourceKind === "thickness",
      customerLabel,
      itemName: source.saleItem.itemName,
      unit: source.saleItem.unit,
      thicknessLabel,
      qtyTaken,
      volumeTaken,
      price: Number(source.saleItem.price),
      lineSubtotal: Number(source.saleItem.subtotal),
      sourceKind,
      legacyKapling: source.purchaseItem?.noKapling ?? null,
      sourceCreatedAt: source.createdAt.toISOString(),
      gradeLabel: source.saleItem.category,
      lengthLabel: source.saleItem.length,
    };
  });

  return {
    rows,
    summary: {
      allocationCount: rows.length,
      uniqueSaleCount: saleIds.size,
      totalQtyTaken,
      totalVolumeTaken,
      qtyByThickness,
    },
  };
}

export type PartaiTransferOption = {
  id: string;
  batchCode: string;
  batchYear: number | null;
  woodSpecies: string | null;
  purchaseDate: Date;
  vendorName: string;
  displayLabel: string;
};

export async function getPartaiTransferOptions(
  excludePurchaseId: string,
): Promise<PartaiTransferOption[]> {
  const rows = await prisma.woodPurchase.findMany({
    where: { id: { not: excludePurchaseId } },
    orderBy: [{ batchYear: "desc" }, { purchaseDate: "desc" }, { batchCode: "asc" }],
    include: { vendor: true },
  });
  return rows.map((row) => ({
    id: row.id,
    batchCode: row.batchCode,
    batchYear: row.batchYear,
    woodSpecies: row.woodSpecies,
    purchaseDate: row.purchaseDate,
    vendorName: row.vendor.name,
    displayLabel: formatPartaiLabel(row),
  }));
}

export type PartaiTransferDestinationPreview = {
  batchCode: string;
  thicknessMm: string;
  qtyAvailable: number;
  unit: string | null;
  hasStockRow: boolean;
};

export async function getPartaiTransferDestinationPreview(
  destinationPurchaseId: string,
  thicknessMmLabel: string,
): Promise<PartaiTransferDestinationPreview | null> {
  const normalizedMm = parseThicknessMmForStock(thicknessMmLabel);
  if (!normalizedMm) {
    return null;
  }

  const purchase = await prisma.woodPurchase.findUnique({
    where: { id: destinationPurchaseId },
    select: { batchCode: true, batchYear: true, woodSpecies: true, purchaseDate: true },
  });
  if (!purchase) {
    return null;
  }

  const stockRow = await prisma.woodPurchaseThicknessStock.findUnique({
    where: {
      purchaseId_thicknessMm: {
        purchaseId: destinationPurchaseId,
        thicknessMm: normalizedMm,
      },
    },
  });

  return {
    batchCode: formatPartaiLabel(purchase),
    thicknessMm: normalizedMm,
    qtyAvailable: stockRow ? Number(stockRow.qtyAvailable) : 0,
    unit: stockRow?.unit ?? null,
    hasStockRow: Boolean(stockRow),
  };
}

export type TransferSaleAllocationResult = {
  saleId: string;
  fromPurchaseId: string;
  destinationPurchaseId: string;
  destinationBatchCode: string;
  thicknessMm: string;
  qtyTransferred: number;
};

/**
 * Pindahkan alokasi penjualan (stok ketebalan) dari satu partai ke partai lain dalam satu transaksi DB.
 * Harga/tanggal/customer/item tidak diubah — hanya `SaleItemSource.thicknessStockId` dan qty stok partai.
 */
export async function transferSaleAllocationToPartai(input: {
  sourceId: string;
  fromPurchaseId: string;
  destinationPurchaseId: string;
}): Promise<TransferSaleAllocationResult> {
  const { sourceId, fromPurchaseId, destinationPurchaseId } = input;

  if (fromPurchaseId === destinationPurchaseId) {
    throw new Error("Partai tujuan tidak boleh sama dengan partai saat ini.");
  }

  return prisma.$transaction(async (tx) => {
    const source = await tx.saleItemSource.findUnique({
      where: { id: sourceId },
      include: {
        thicknessStock: { include: { purchase: true } },
        saleItem: true,
      },
    });

    if (!source) {
      throw new Error("Alokasi penjualan tidak ditemukan.");
    }
    if (!source.thicknessStockId || !source.thicknessStock) {
      throw new Error(
        "Alokasi log/kapling lama tidak bisa dipindahkan dari sini. Ubah lewat edit penjualan.",
      );
    }
    if (source.thicknessStock.purchaseId !== fromPurchaseId) {
      throw new Error("Alokasi ini tidak terhubung ke partai yang sedang dibuka.");
    }

    const qtyTaken = Number(source.qtyTaken);
    if (qtyTaken <= 0) {
      throw new Error("Qty alokasi tidak valid.");
    }

    const itemQty = Number(source.saleItem.qty);
    if (itemQty <= 0) {
      throw new Error("Qty item penjualan tidak valid.");
    }
    if (Math.abs(itemQty - qtyTaken) > 1e-6) {
      throw new Error(
        "Qty alokasi tidak sama dengan qty item. Sesuaikan lewat edit penjualan sebelum memindahkan.",
      );
    }

    const mmFromItem = parseThicknessMmForStock(source.saleItem.thickness);
    if (!mmFromItem) {
      throw new Error(
        `Isi tebal (mm) pada item "${source.saleItem.itemName}" agar pemindahan bisa dilakukan.`,
      );
    }
    if (
      !thicknessMmMatches(source.thicknessStock.thicknessMm.toString(), mmFromItem)
    ) {
      throw new Error(
        `Tebal item (${mmFromItem} mm) tidak cocok dengan stok partai asal (${source.thicknessStock.thicknessMm} mm).`,
      );
    }

    const destStock = await tx.woodPurchaseThicknessStock.findUnique({
      where: {
        purchaseId_thicknessMm: {
          purchaseId: destinationPurchaseId,
          thicknessMm: mmFromItem,
        },
      },
      include: { purchase: true },
    });

    if (!destStock) {
      throw new Error(
        `Partai tujuan tidak memiliki baris stok untuk ketebalan ${mmFromItem} mm. Tambahkan baris stok di detail partai tujuan.`,
      );
    }

    const available = Number(destStock.qtyAvailable);
    if (available < qtyTaken) {
      throw new Error(
        `Stok tidak cukup di partai tujuan "${formatPartaiLabel(destStock.purchase)}" untuk ${mmFromItem} mm: tersedia ${available.toLocaleString("id-ID")}, dibutuhkan ${qtyTaken.toLocaleString("id-ID")}.`,
      );
    }

    await tx.woodPurchaseThicknessStock.update({
      where: { id: source.thicknessStockId },
      data: { qtyAvailable: { increment: qtyTaken.toString() } },
    });

    await tx.woodPurchaseThicknessStock.update({
      where: { id: destStock.id },
      data: { qtyAvailable: { decrement: qtyTaken.toString() } },
    });

    await tx.saleItemSource.update({
      where: { id: sourceId },
      data: { thicknessStockId: destStock.id },
    });

    // TODO: PartaiAllocationTransfer log table when audit history is needed.

    return {
      saleId: source.saleItem.saleId,
      fromPurchaseId,
      destinationPurchaseId,
      destinationBatchCode: formatPartaiLabel(destStock.purchase),
      thicknessMm: mmFromItem,
      qtyTransferred: qtyTaken,
    };
  });
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
  batchYear: number | null;
  woodSpecies: string | null;
  purchaseDate: Date;
  partaiLabel: string;
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
      batchYear: row.purchase.batchYear,
      woodSpecies: row.purchase.woodSpecies,
      purchaseDate: row.purchase.purchaseDate,
      partaiLabel: formatPartaiLabel(row.purchase),
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

  // Tanpa interactive $transaction — lebih cepat & stabil lewat Supabase pooler (hindari 08P01).
  let purchase;
  try {
    purchase = await prisma.woodPurchase.create({
      data: {
        clientRequestId: requestKey || null,
        vendorId: input.vendorId,
        purchaseDate: input.purchaseDate,
        batchCode: input.batchCode.trim(),
        batchYear: input.batchYear ?? null,
        woodSpecies: input.woodSpecies?.trim() || null,
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

  await prisma.woodPurchaseItem.createMany({
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

  await ensureDefaultThicknessStockRows(prisma, purchase.id);

  return purchase;
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
        batchCode: input.batchCode.trim(),
        batchYear: input.batchYear ?? null,
        woodSpecies: input.woodSpecies?.trim() || null,
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
