-- Create customer master table
CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- Prevent duplicate customer names
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_name_key" ON "Customer"("name");

-- Add optional relation column for safe transition from legacy data
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- Keep legacy customerName for backward compatibility fallback
ALTER TABLE "Sale" ALTER COLUMN "customerName" DROP NOT NULL;

-- Index and FK for customer relation
CREATE INDEX IF NOT EXISTS "Sale_customerId_idx" ON "Sale"("customerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Sale_customerId_fkey'
  ) THEN
    ALTER TABLE "Sale"
    ADD CONSTRAINT "Sale_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
