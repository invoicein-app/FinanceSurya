-- Rename mut -> mutu if old column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'WoodPurchaseItem' AND column_name = 'mut'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'WoodPurchaseItem' AND column_name = 'mutu'
  ) THEN
    ALTER TABLE "WoodPurchaseItem" RENAME COLUMN "mut" TO "mutu";
  END IF;
END $$;

-- Ensure mutu exists even if rename was not possible
ALTER TABLE "WoodPurchaseItem" ADD COLUMN IF NOT EXISTS "mutu" DECIMAL(10,2);

-- Drop trs column if it exists
ALTER TABLE "WoodPurchaseItem" DROP COLUMN IF EXISTS "trs";
