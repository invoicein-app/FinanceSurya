import { Prisma, type PrismaClient } from "@prisma/client";

import { collectCustomerPriceListUpsertOps } from "@/lib/pricing/upsert-customer-price-list";
import { buildVeneerItemDescription } from "@/lib/sales/item-description";
import { parseThicknessMmForStock } from "@/lib/sales/thickness-mm";
import { collectVeneerTemplateSaleSqlOps } from "@/lib/services/veneer-template-service";
import { recalculateInvoiceGroupTotals } from "@/lib/services/invoice-group-service";
import { prisma } from "@/lib/prisma";

/** Karakter NUL tidak valid di teks Postgres dan bisa memicu error protokol (08P01). */
function sanitizePgText(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const s = String(value).replace(/\u0000/g, "").trim();
  return s.length === 0 ? null : s;
}

function sanitizePgRequired(value: unknown): string {
  const s = String(value ?? "").replace(/\u0000/g, "").trim();
  return s.length > 0 ? s : "(tanpa nama)";
}

/** JSON form bisa mengirim angka untuk kolom yang di schema bertipe String — adapter `pg` tidak meng-coerce seperti engine Rust. */
function coerceOptionalTrimmedText(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  const s = String(value).replace(/\u0000/g, "").trim();
  return s.length === 0 ? undefined : s;
}

type StockResolveDb = Pick<PrismaClient, "woodPurchaseThicknessStock">;

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
  clientRequestId?: string;
  note?: string;
  items: CreateSaleItemInput[];
};

export type UpdateSaleInput = CreateSaleInput;

export async function getSales() {
  return prisma.sale.findMany({
    orderBy: { saleDate: "desc" },
    include: {
      customer: true,
      invoiceGroup: {
        select: {
          id: true,
          manualInvoiceCode: true,
          paymentStatus: true,
        },
      },
      saleItems: {
        include: {
          sources: {
            include: {
              purchaseItem: {
                include: {
                  purchase: { select: { batchCode: true } },
                },
              },
              thicknessStock: {
                include: {
                  purchase: { select: { batchCode: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function deleteSale(id: string) {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("ID penjualan tidak valid.");
  }

  const sale = await prisma.sale.findUnique({
    where: { id: trimmedId },
    include: {
      saleItems: {
        include: { sources: true },
      },
    },
  });

  if (!sale) {
    throw new Error("Transaksi penjualan tidak ditemukan.");
  }

  const invoiceGroupId = sale.invoiceGroupId;

  const rollbackThick = new Map<string, number>();
  const rollbackLegacy = new Map<string, { qty: number; volume: number }>();
  for (const saleItem of sale.saleItems) {
    for (const src of saleItem.sources) {
      if (src.thicknessStockId) {
        rollbackThick.set(
          src.thicknessStockId,
          (rollbackThick.get(src.thicknessStockId) ?? 0) + Number(src.qtyTaken),
        );
      }
      if (src.purchaseItemId) {
        const cur = rollbackLegacy.get(src.purchaseItemId) ?? { qty: 0, volume: 0 };
        rollbackLegacy.set(src.purchaseItemId, {
          qty: cur.qty + Number(src.qtyTaken),
          volume: cur.volume + Number(src.volumeTaken),
        });
      }
    }
  }

  for (const [stockId, qty] of rollbackThick) {
    await prisma.woodPurchaseThicknessStock.update({
      where: { id: stockId },
      data: { qtyAvailable: { increment: qty.toString() } },
    });
  }
  for (const [purchaseItemId, { qty, volume }] of rollbackLegacy) {
    await prisma.woodPurchaseItem.update({
      where: { id: purchaseItemId },
      data: {
        remainingQty: { increment: qty.toString() },
        remainingVolume: { increment: volume.toString() },
      },
    });
  }

  await prisma.sale.delete({ where: { id: trimmedId } });

  if (invoiceGroupId) {
    const remaining = await prisma.sale.count({ where: { invoiceGroupId } });
    if (remaining === 0) {
      await prisma.invoiceGroup.delete({ where: { id: invoiceGroupId } });
    } else {
      await recalculateInvoiceGroupTotals(invoiceGroupId);
    }
  }
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      invoiceGroup: {
        select: {
          id: true,
          manualInvoiceCode: true,
          paymentStatus: true,
        },
      },
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

  const customer = input.customerId
    ? await prisma.customer.findUnique({
        where: { id: input.customerId },
      })
    : null;

  if (!customer && input.customerId) {
    throw new Error("Customer tidak ditemukan.");
  }

  const requestKey = input.clientRequestId?.trim();
  if (requestKey) {
    const existing = await prisma.sale.findUnique({
      where: { clientRequestId: requestKey },
    });
    if (existing) {
      return existing;
    }
  }

  const preparedLines = await prepareSaleLines(prisma, normalizedItems);
  const { thickness: thickDec, legacy: legacyDec } =
    aggregateDeductionsFromPreparedLines(preparedLines);

  const veneerLines = normalizedItems.map((item) => ({
    thickness: item.thickness,
    width: item.width,
    length: item.length,
    grade: item.category,
    unit: item.unit,
    price: item.price,
  }));
  const veneerOps = await collectVeneerTemplateSaleSqlOps(
    prisma,
    customer?.id ?? input.customerId ?? "",
    veneerLines,
  );

  // Header penjualan terpisah (perlu sale.id). Batch `$transaction([...])` + nested writes ke pooler
  // transaksi Supabase sering memicu Postgres 08P01 — jalankan mutasi berurutan (satu query per round-trip).
  let sale;
  try {
    sale = await prisma.sale.create({
      data: {
        clientRequestId: requestKey || null,
        saleDate: input.saleDate,
        customerId: customer?.id ?? null,
        customerName: sanitizePgText(customer?.name ?? null),
        note: sanitizePgText(input.note ?? null),
        grandTotal: grandTotal.toString(),
      },
    });
  } catch (error) {
    if (
      requestKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.sale.findUnique({
        where: { clientRequestId: requestKey },
      });
      if (existing) {
        return existing;
      }
    }
    throw error;
  }

  const appliedThickDec = new Map<string, number>();
  const appliedLegacyDec = new Map<string, { qty: number; volume: number }>();

  try {
    for (const { item, sourcesPersisted } of preparedLines) {
      const row = await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          itemName: sanitizePgRequired(item.itemName),
          category: sanitizePgText(item.category),
          thickness: sanitizePgText(item.thickness),
          width: sanitizePgText(item.width),
          length: sanitizePgText(item.length),
          unit: sanitizePgText(item.unit),
          qty: item.qty.toString(),
          price: item.price.toString(),
          subtotal: item.subtotal.toString(),
          note: sanitizePgText(item.note ?? null),
        },
      });

      for (const src of sourcesPersisted) {
        await prisma.saleItemSource.create({
          data: {
            saleItemId: row.id,
            purchaseItemId: src.purchaseItemId,
            thicknessStockId: src.thicknessStockId,
            qtyTaken: src.qtyTaken.toString(),
            volumeTaken: src.volumeTaken.toString(),
            costAmount: src.costAmount.toString(),
          },
        });
      }
    }

    for (const [stockId, qty] of thickDec) {
      await prisma.woodPurchaseThicknessStock.update({
        where: { id: stockId },
        data: { qtyAvailable: { decrement: qty.toString() } },
      });
      appliedThickDec.set(stockId, qty);
    }
    for (const [purchaseItemId, { qty, volume }] of legacyDec) {
      await prisma.woodPurchaseItem.update({
        where: { id: purchaseItemId },
        data: {
          remainingQty: { decrement: qty.toString() },
          remainingVolume: { decrement: volume.toString() },
        },
      });
      appliedLegacyDec.set(purchaseItemId, { qty, volume });
    }

    if (customer?.id) {
      const priceOps = collectCustomerPriceListUpsertOps(prisma, {
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
      for (const op of priceOps) {
        await op;
      }
    }

    for (const op of veneerOps) {
      await op;
    }
  } catch (error) {
    for (const [stockId, qty] of appliedThickDec) {
      await prisma.woodPurchaseThicknessStock
        .update({
          where: { id: stockId },
          data: { qtyAvailable: { increment: qty.toString() } },
        })
        .catch(() => undefined);
    }
    for (const [purchaseItemId, { qty, volume }] of appliedLegacyDec) {
      await prisma.woodPurchaseItem
        .update({
          where: { id: purchaseItemId },
          data: {
            remainingQty: { increment: qty.toString() },
            remainingVolume: { increment: volume.toString() },
          },
        })
        .catch(() => undefined);
    }
    await prisma.sale.delete({ where: { id: sale.id } }).catch(() => undefined);
    throw error;
  }

  return sale;
}

export async function updateSale(id: string, input: UpdateSaleInput) {
  if (input.items.length === 0) {
    throw new Error("Minimal satu item penjualan wajib diisi.");
  }

  const existingSale = await prisma.sale.findUnique({
    where: { id },
    select: { invoiceGroupId: true },
  });

  if (!existingSale) {
    throw new Error("Transaksi penjualan tidak ditemukan.");
  }

  const normalizedItems = normalizeSaleItems(input.items);
  const grandTotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const existingSaleItems = await prisma.saleItem.findMany({
    where: { saleId: id },
    include: { sources: true },
  });

  const customer = input.customerId
    ? await prisma.customer.findUnique({
        where: { id: input.customerId },
      })
    : null;

  if (!customer && input.customerId) {
    throw new Error("Customer tidak ditemukan.");
  }

  const preparedLines = await prepareSaleLines(prisma, normalizedItems);
  const { thickness: newThick, legacy: newLegacy } =
    aggregateDeductionsFromPreparedLines(preparedLines);

  const rollbackThick = new Map<string, number>();
  const rollbackLegacy = new Map<string, { qty: number; volume: number }>();
  for (const si of existingSaleItems) {
    for (const src of si.sources) {
      if (src.thicknessStockId) {
        rollbackThick.set(
          src.thicknessStockId,
          (rollbackThick.get(src.thicknessStockId) ?? 0) + Number(src.qtyTaken),
        );
      }
      if (src.purchaseItemId) {
        const cur = rollbackLegacy.get(src.purchaseItemId) ?? { qty: 0, volume: 0 };
        rollbackLegacy.set(src.purchaseItemId, {
          qty: cur.qty + Number(src.qtyTaken),
          volume: cur.volume + Number(src.volumeTaken),
        });
      }
    }
  }

  const veneerLines = normalizedItems.map((item) => ({
    thickness: item.thickness,
    width: item.width,
    length: item.length,
    grade: item.category,
    unit: item.unit,
    price: item.price,
  }));
  const veneerOps = await collectVeneerTemplateSaleSqlOps(
    prisma,
    customer?.id ?? input.customerId ?? "",
    veneerLines,
  );

  for (const [stockId, qty] of rollbackThick) {
    await prisma.woodPurchaseThicknessStock.update({
      where: { id: stockId },
      data: { qtyAvailable: { increment: qty.toString() } },
    });
  }
  for (const [purchaseItemId, { qty, volume }] of rollbackLegacy) {
    await prisma.woodPurchaseItem.update({
      where: { id: purchaseItemId },
      data: {
        remainingQty: { increment: qty.toString() },
        remainingVolume: { increment: volume.toString() },
      },
    });
  }

  await prisma.saleItemSource.deleteMany({
    where: { saleItem: { saleId: id } },
  });
  await prisma.saleItem.deleteMany({ where: { saleId: id } });

  await prisma.sale.update({
    where: { id },
    data: {
      saleDate: input.saleDate,
      customerId: customer?.id ?? null,
      customerName: sanitizePgText(customer?.name ?? null),
      note: sanitizePgText(input.note ?? null),
      grandTotal: grandTotal.toString(),
    },
  });

  for (const { item, sourcesPersisted } of preparedLines) {
    const row = await prisma.saleItem.create({
      data: {
        saleId: id,
        itemName: sanitizePgRequired(item.itemName),
        category: sanitizePgText(item.category),
        thickness: sanitizePgText(item.thickness),
        width: sanitizePgText(item.width),
        length: sanitizePgText(item.length),
        unit: sanitizePgText(item.unit),
        qty: item.qty.toString(),
        price: item.price.toString(),
        subtotal: item.subtotal.toString(),
        note: sanitizePgText(item.note ?? null),
      },
    });

    for (const src of sourcesPersisted) {
      await prisma.saleItemSource.create({
        data: {
          saleItemId: row.id,
          purchaseItemId: src.purchaseItemId,
          thicknessStockId: src.thicknessStockId,
          qtyTaken: src.qtyTaken.toString(),
          volumeTaken: src.volumeTaken.toString(),
          costAmount: src.costAmount.toString(),
        },
      });
    }
  }

  for (const [stockId, qty] of newThick) {
    await prisma.woodPurchaseThicknessStock.update({
      where: { id: stockId },
      data: { qtyAvailable: { decrement: qty.toString() } },
    });
  }
  for (const [purchaseItemId, { qty, volume }] of newLegacy) {
    await prisma.woodPurchaseItem.update({
      where: { id: purchaseItemId },
      data: {
        remainingQty: { decrement: qty.toString() },
        remainingVolume: { decrement: volume.toString() },
      },
    });
  }

  if (customer?.id) {
    const priceOps = collectCustomerPriceListUpsertOps(prisma, {
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
    for (const op of priceOps) {
      await op;
    }
  }

  for (const op of veneerOps) {
    await op;
  }

  if (existingSale.invoiceGroupId) {
    await recalculateInvoiceGroupTotals(existingSale.invoiceGroupId);
  }

  return prisma.sale.findUnique({
    where: { id },
    include: { saleItems: true },
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

/**
 * Paksa kolom teks jadi string primitif — adapter `pg` memicu P2032 jika masih typeof number (mis. dari JSON.parse).
 */
function freezeNormalizedSaleLineTextFields(line: NormalizedSaleLine): NormalizedSaleLine {
  return {
    ...line,
    itemName: String(line.itemName ?? "").trim() || "(tanpa nama)",
    category:
      line.category != null ? String(line.category).replace(/\u0000/g, "").trim() || undefined : undefined,
    thickness:
      line.thickness != null ? String(line.thickness).replace(/\u0000/g, "").trim() || undefined : undefined,
    width: line.width != null ? String(line.width).replace(/\u0000/g, "").trim() || undefined : undefined,
    length: line.length != null ? String(line.length).replace(/\u0000/g, "").trim() || undefined : undefined,
    unit: line.unit != null ? String(line.unit).replace(/\u0000/g, "").trim() || undefined : undefined,
    note: line.note != null ? String(line.note).replace(/\u0000/g, "").trim() || undefined : undefined,
  };
}

type PersistedSourceRow = {
  purchaseItemId: string | null;
  thicknessStockId: string | null;
  qtyTaken: number;
  volumeTaken: number;
  costAmount: number;
};

type PreparedSaleLine = {
  item: NormalizedSaleLine;
  sourcesPersisted: PersistedSourceRow[];
};

async function resolveSourceToPersistedRow(
  db: StockResolveDb,
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
    const row = await db.woodPurchaseThicknessStock.findUnique({
      where: { id: source.thicknessStockId },
      include: { purchase: true },
    });
    if (!row) {
      throw new Error("Baris stok ketebalan tidak ditemukan.");
    }
    // qtyAvailable boleh menjadi negatif (penjualan maju vs laporan stok veneer yang belum masuk).
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

  const row = await db.woodPurchaseThicknessStock.findUnique({
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

  return {
    purchaseItemId: null,
    thicknessStockId: row.id,
    qtyTaken: item.qty,
    volumeTaken: 0,
    costAmount: 0,
  };
}

async function prepareSaleLines(
  db: StockResolveDb,
  normalizedItems: NormalizedSaleLine[],
): Promise<PreparedSaleLine[]> {
  const preparedLines: PreparedSaleLine[] = [];
  for (const item of normalizedItems) {
    const sourcesPersisted: PersistedSourceRow[] = [];
    for (const source of item.sources) {
      sourcesPersisted.push(await resolveSourceToPersistedRow(db, item, source));
    }
    preparedLines.push({ item, sourcesPersisted });
  }
  return preparedLines;
}

function aggregateDeductionsFromPreparedLines(prepared: PreparedSaleLine[]): {
  thickness: Map<string, number>;
  legacy: Map<string, { qty: number; volume: number }>;
} {
  const thickness = new Map<string, number>();
  const legacy = new Map<string, { qty: number; volume: number }>();
  for (const { sourcesPersisted } of prepared) {
    for (const row of sourcesPersisted) {
      if (row.thicknessStockId) {
        thickness.set(
          row.thicknessStockId,
          (thickness.get(row.thicknessStockId) ?? 0) + row.qtyTaken,
        );
      }
      if (row.purchaseItemId) {
        const cur = legacy.get(row.purchaseItemId) ?? { qty: 0, volume: 0 };
        legacy.set(row.purchaseItemId, {
          qty: cur.qty + row.qtyTaken,
          volume: cur.volume + row.volumeTaken,
        });
      }
    }
  }
  return { thickness, legacy };
}

function normalizeSaleItems(items: CreateSaleItemInput[]): NormalizedSaleLine[] {
  const normalizedItems = items
    .map((item) => {
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

      const category = coerceOptionalTrimmedText(item.category);
      const thickness = coerceOptionalTrimmedText(item.thickness);
      const width = coerceOptionalTrimmedText(item.width);
      const length = coerceOptionalTrimmedText(item.length);
      const unit = coerceOptionalTrimmedText(item.unit);
      const note = coerceOptionalTrimmedText(item.note);
      const explicitName = coerceOptionalTrimmedText(item.itemName);
      const itemName =
        explicitName ||
        buildVeneerItemDescription({
          thickness,
          width,
          length,
          mutu: category,
        });

      return {
        itemName,
        category,
        thickness,
        width,
        length,
        unit,
        qty: item.qty,
        price: item.price,
        note,
        subtotal: item.qty * item.price,
        sources: parsedSources,
      };
    })
    .filter((item) => item.itemName.length > 0)
    .map(freezeNormalizedSaleLineTextFields);

  return normalizedItems;
}
