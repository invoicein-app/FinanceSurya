-- Samakan nama kolom legacy "mut" dengan field Prisma "mutu" di WoodPurchaseItem
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'WoodPurchaseItem'
      AND column_name = 'mut'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'WoodPurchaseItem'
      AND column_name = 'mutu'
  ) THEN
    ALTER TABLE "WoodPurchaseItem" RENAME COLUMN "mut" TO "mutu";
  END IF;
END $$;
