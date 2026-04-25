-- Baris stok default 0.6 & 1.2 mm (qty 0) untuk setiap partai yang belum punya kombinasi tersebut
INSERT INTO "WoodPurchaseThicknessStock" ("id", "purchaseId", "thicknessMm", "qtyAvailable", "unit", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p."id", 0.600, 0, 'lembar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "WoodPurchase" p
WHERE NOT EXISTS (
  SELECT 1 FROM "WoodPurchaseThicknessStock" s
  WHERE s."purchaseId" = p."id" AND s."thicknessMm" = 0.600
);

INSERT INTO "WoodPurchaseThicknessStock" ("id", "purchaseId", "thicknessMm", "qtyAvailable", "unit", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, p."id", 1.200, 0, 'lembar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "WoodPurchase" p
WHERE NOT EXISTS (
  SELECT 1 FROM "WoodPurchaseThicknessStock" s
  WHERE s."purchaseId" = p."id" AND s."thicknessMm" = 1.200
);
