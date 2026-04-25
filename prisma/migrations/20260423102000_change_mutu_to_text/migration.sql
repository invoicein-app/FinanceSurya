-- Ubah mutu jadi teks agar bisa isi alphabet (A/B/C, dsb.)
ALTER TABLE "WoodPurchaseItem"
  ALTER COLUMN "mutu" TYPE TEXT
  USING CASE
    WHEN "mutu" IS NULL THEN NULL
    ELSE "mutu"::TEXT
  END;
