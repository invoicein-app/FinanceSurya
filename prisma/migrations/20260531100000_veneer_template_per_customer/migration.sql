-- Template penjualan per customer (bukan global).
DELETE FROM "VeneerTemplate";

ALTER TABLE "VeneerTemplate" ADD COLUMN "customerId" TEXT NOT NULL;

ALTER TABLE "VeneerTemplate"
  ADD CONSTRAINT "VeneerTemplate_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "VeneerTemplate_specKey_key";

CREATE UNIQUE INDEX "VeneerTemplate_customerId_specKey_key"
  ON "VeneerTemplate"("customerId", "specKey");

CREATE INDEX "VeneerTemplate_customerId_idx" ON "VeneerTemplate"("customerId");
