-- SaleItem.thickness / width / length dibuat sebagai DECIMAL di 20260415170000_sale_item_manual_input.
-- Schema Prisma memodelkan kolom ini sebagai String (TEXT). Migrasi 20260418120000 memakai
-- ADD COLUMN IF NOT EXISTS ... TEXT sehingga kolom yang sudah DECIMAL tidak berubah.
-- Tanpa ini, @prisma/adapter-pg bisa memunculkan P2032 ("expected String", nilai numerik 0.6).
ALTER TABLE "SaleItem" ALTER COLUMN "thickness" TYPE TEXT USING ("thickness"::TEXT);
ALTER TABLE "SaleItem" ALTER COLUMN "width" TYPE TEXT USING ("width"::TEXT);
ALTER TABLE "SaleItem" ALTER COLUMN "length" TYPE TEXT USING ("length"::TEXT);
