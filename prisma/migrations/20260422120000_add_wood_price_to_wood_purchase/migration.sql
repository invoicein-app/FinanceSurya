-- Harga kayu (header partai), dijumlahkan ke grand total bersama biaya lain
ALTER TABLE "WoodPurchase" ADD COLUMN IF NOT EXISTS "woodPrice" DECIMAL(14,2) NOT NULL DEFAULT 0;
