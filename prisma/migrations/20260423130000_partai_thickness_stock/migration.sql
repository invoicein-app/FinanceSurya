-- Stok per partai per ketebalan (unit utama: qty)
CREATE TABLE "WoodPurchaseThicknessStock" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "thicknessMm" DECIMAL(10,3) NOT NULL,
    "qtyAvailable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WoodPurchaseThicknessStock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WoodPurchaseThicknessStock_purchaseId_thicknessMm_key"
    ON "WoodPurchaseThicknessStock"("purchaseId", "thicknessMm");

CREATE INDEX "WoodPurchaseThicknessStock_purchaseId_idx"
    ON "WoodPurchaseThicknessStock"("purchaseId");

ALTER TABLE "WoodPurchaseThicknessStock"
    ADD CONSTRAINT "WoodPurchaseThicknessStock_purchaseId_fkey"
    FOREIGN KEY ("purchaseId") REFERENCES "WoodPurchase"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Alokasi penjualan: dukung thicknessStockId; riwayat lama tetap pakai purchaseItemId
ALTER TABLE "SaleItemSource" ADD COLUMN "thicknessStockId" TEXT;

ALTER TABLE "SaleItemSource" ALTER COLUMN "purchaseItemId" DROP NOT NULL;

CREATE INDEX "SaleItemSource_thicknessStockId_idx" ON "SaleItemSource"("thicknessStockId");

ALTER TABLE "SaleItemSource"
    ADD CONSTRAINT "SaleItemSource_thicknessStockId_fkey"
    FOREIGN KEY ("thicknessStockId") REFERENCES "WoodPurchaseThicknessStock"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
