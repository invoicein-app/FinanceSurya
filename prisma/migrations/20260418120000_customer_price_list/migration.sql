-- CustomerPriceList: harga terakhir per customer per kombinasi item (otomatis dari penjualan)
CREATE TABLE IF NOT EXISTS "CustomerPriceList" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT,
    "thickness" TEXT,
    "width" TEXT,
    "length" TEXT,
    "unit" TEXT,
    "latestPrice" DECIMAL(14,2) NOT NULL,
    "lastSaleDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerPriceList_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerPriceList_customerId_itemKey_key" ON "CustomerPriceList"("customerId", "itemKey");

CREATE INDEX IF NOT EXISTS "CustomerPriceList_customerId_idx" ON "CustomerPriceList"("customerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CustomerPriceList_customerId_fkey'
  ) THEN
    ALTER TABLE "CustomerPriceList"
      ADD CONSTRAINT "CustomerPriceList_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Spesifikasi opsional per baris penjualan (untuk itemKey & price list)
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "thickness" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "width" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "length" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "unit" TEXT;
