-- =============================================================================
-- SuryaFinance — Identitas Partai (tahun + jenis kayu)
-- =============================================================================
-- Jalankan di Supabase SQL Editor
-- =============================================================================

ALTER TABLE "WoodPurchase" ADD COLUMN IF NOT EXISTS "batchYear" INTEGER;
ALTER TABLE "WoodPurchase" ADD COLUMN IF NOT EXISTS "woodSpecies" TEXT;

CREATE INDEX IF NOT EXISTS "WoodPurchase_batchYear_idx"
  ON "WoodPurchase" ("batchYear");

-- Opsional: isi tahun dari tanggal pembelian untuk data lama
-- UPDATE "WoodPurchase"
-- SET "batchYear" = EXTRACT(YEAR FROM "purchaseDate")::INTEGER
-- WHERE "batchYear" IS NULL;
