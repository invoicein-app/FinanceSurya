import { prisma } from "@/lib/prisma";

/** Stok veneer per partai per ketebalan (model utama inventori untuk penjualan). */
export async function getThicknessStockLedger() {
  return prisma.woodPurchaseThicknessStock.findMany({
    orderBy: [{ purchase: { purchaseDate: "desc" } }, { thicknessMm: "asc" }],
    include: {
      purchase: {
        include: {
          vendor: true,
        },
      },
    },
  });
}

/** Baris log/partai lama (volume & qty kapling) — dipisahkan dari stok per ketebalan. */
export async function getBatchStock() {
  return prisma.woodPurchaseItem.findMany({
    orderBy: [{ purchase: { purchaseDate: "desc" } }, { createdAt: "asc" }],
    include: {
      purchase: {
        include: {
          vendor: true,
        },
      },
    },
  });
}
