ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "clientRequestId" TEXT;
ALTER TABLE "WoodPurchase" ADD COLUMN IF NOT EXISTS "clientRequestId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Sale_clientRequestId_key" ON "Sale"("clientRequestId");
CREATE UNIQUE INDEX IF NOT EXISTS "WoodPurchase_clientRequestId_key" ON "WoodPurchase"("clientRequestId");
