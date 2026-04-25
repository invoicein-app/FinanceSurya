-- Vendor master
CREATE TABLE IF NOT EXISTS "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_name_key" ON "Vendor"("name");

-- Purchase batch header
CREATE TABLE IF NOT EXISTS "WoodPurchase" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "batchCode" TEXT NOT NULL,
    "documentNumber" TEXT,
    "note" TEXT,
    "bpCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cuttingCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WoodPurchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WoodPurchase_vendorId_idx" ON "WoodPurchase"("vendorId");
CREATE INDEX IF NOT EXISTS "WoodPurchase_purchaseDate_idx" ON "WoodPurchase"("purchaseDate");

-- Purchase batch items
CREATE TABLE IF NOT EXISTS "WoodPurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "noKapling" TEXT NOT NULL,
    "woodType" TEXT NOT NULL,
    "sort" TEXT,
    "length" DECIMAL(10,2),
    "diameter" DECIMAL(10,2),
    "logQty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "volume" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "mut" DECIMAL(10,2),
    "status" TEXT,
    "trs" DECIMAL(14,2),
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remainingQty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remainingVolume" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WoodPurchaseItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WoodPurchaseItem_purchaseId_idx" ON "WoodPurchaseItem"("purchaseId");
CREATE INDEX IF NOT EXISTS "WoodPurchaseItem_woodType_idx" ON "WoodPurchaseItem"("woodType");

-- SaleItemSource bridge for mixed-batch allocation
CREATE TABLE IF NOT EXISTS "SaleItemSource" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "purchaseItemId" TEXT NOT NULL,
    "qtyTaken" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "volumeTaken" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "costAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SaleItemSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SaleItemSource_saleItemId_idx" ON "SaleItemSource"("saleItemId");
CREATE INDEX IF NOT EXISTS "SaleItemSource_purchaseItemId_idx" ON "SaleItemSource"("purchaseItemId");

-- SaleItem columns for new structure
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "itemName" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "note" TEXT;

UPDATE "SaleItem"
SET "itemName" = COALESCE("itemName", 'Item Kayu');

ALTER TABLE "SaleItem" ALTER COLUMN "itemName" SET NOT NULL;

-- Foreign keys (drop then recreate to keep script rerunnable enough)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WoodPurchase_vendorId_fkey'
  ) THEN
    ALTER TABLE "WoodPurchase"
    ADD CONSTRAINT "WoodPurchase_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WoodPurchaseItem_purchaseId_fkey'
  ) THEN
    ALTER TABLE "WoodPurchaseItem"
    ADD CONSTRAINT "WoodPurchaseItem_purchaseId_fkey"
    FOREIGN KEY ("purchaseId") REFERENCES "WoodPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SaleItemSource_saleItemId_fkey'
  ) THEN
    ALTER TABLE "SaleItemSource"
    ADD CONSTRAINT "SaleItemSource_saleItemId_fkey"
    FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SaleItemSource_purchaseItemId_fkey'
  ) THEN
    ALTER TABLE "SaleItemSource"
    ADD CONSTRAINT "SaleItemSource_purchaseItemId_fkey"
    FOREIGN KEY ("purchaseItemId") REFERENCES "WoodPurchaseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
