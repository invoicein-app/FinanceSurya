-- AlterTable
ALTER TABLE "WoodPurchase" ADD COLUMN "batchYear" INTEGER,
ADD COLUMN "woodSpecies" TEXT;

-- CreateIndex
CREATE INDEX "WoodPurchase_batchYear_idx" ON "WoodPurchase"("batchYear");
