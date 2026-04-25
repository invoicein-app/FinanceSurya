-- Make product relation optional so manual items are supported
ALTER TABLE "SaleItem" ALTER COLUMN "productId" DROP NOT NULL;

-- Add manual item fields
ALTER TABLE "SaleItem"
ADD COLUMN "itemName" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "thickness" DECIMAL(10,2),
ADD COLUMN "width" DECIMAL(10,2),
ADD COLUMN "length" DECIMAL(10,2),
ADD COLUMN "unit" TEXT,
ADD COLUMN "note" TEXT;

-- Backfill existing rows from product master where available
UPDATE "SaleItem" si
SET
  "itemName" = COALESCE(p."name", 'Item Kayu'),
  "category" = p."category",
  "unit" = p."unit"
FROM "Product" p
WHERE si."productId" = p."id";

-- Backfill rows without product relation
UPDATE "SaleItem"
SET "itemName" = 'Item Kayu'
WHERE "itemName" IS NULL;

-- Enforce required manual item name after backfill
ALTER TABLE "SaleItem" ALTER COLUMN "itemName" SET NOT NULL;

-- Recreate FK with SET NULL strategy for flexible manual edits
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_productId_fkey";
ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
