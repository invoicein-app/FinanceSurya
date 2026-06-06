-- =============================================================================
-- SuryaFinance — Invoice Group (grouping penjualan + kode invoice manual)
-- =============================================================================
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor → New query
--   2. Copy-paste seluruh file ini
--   3. Klik Run
--
-- Tidak perlu `prisma migrate`. Script ini idempotent (aman di-run ulang).
-- Setelah sukses, deploy/restart app Next.js seperti biasa.
-- =============================================================================

-- 1) Enum status pembayaran
DO $$
BEGIN
  CREATE TYPE "InvoicePaymentStatus" AS ENUM ('unpaid', 'partial', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Tabel InvoiceGroup
CREATE TABLE IF NOT EXISTS "InvoiceGroup" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "manualInvoiceCode" TEXT NOT NULL,
  "invoiceDate" TIMESTAMP(3) NOT NULL,
  "totalAmount" DECIMAL(14, 2) NOT NULL,
  "paidAmount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "remainingAmount" DECIMAL(14, 2) NOT NULL,
  "paymentStatus" "InvoicePaymentStatus" NOT NULL DEFAULT 'unpaid',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceGroup_pkey" PRIMARY KEY ("id")
);

-- 3) Kolom relasi di Sale (1 penjualan → max 1 invoice group)
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "invoiceGroupId" TEXT;

-- 4) Index
CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceGroup_manualInvoiceCode_key"
  ON "InvoiceGroup" ("manualInvoiceCode");

CREATE INDEX IF NOT EXISTS "InvoiceGroup_customerId_idx"
  ON "InvoiceGroup" ("customerId");

CREATE INDEX IF NOT EXISTS "InvoiceGroup_invoiceDate_idx"
  ON "InvoiceGroup" ("invoiceDate");

CREATE INDEX IF NOT EXISTS "InvoiceGroup_paymentStatus_idx"
  ON "InvoiceGroup" ("paymentStatus");

CREATE INDEX IF NOT EXISTS "Sale_invoiceGroupId_idx"
  ON "Sale" ("invoiceGroupId");

-- 5) Foreign key: Sale → InvoiceGroup (hapus group = lepas penjualan)
DO $$
BEGIN
  ALTER TABLE "Sale"
    ADD CONSTRAINT "Sale_invoiceGroupId_fkey"
    FOREIGN KEY ("invoiceGroupId")
    REFERENCES "InvoiceGroup" ("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 6) Foreign key: InvoiceGroup → Customer
DO $$
BEGIN
  ALTER TABLE "InvoiceGroup"
    ADD CONSTRAINT "InvoiceGroup_customerId_fkey"
    FOREIGN KEY ("customerId")
    REFERENCES "Customer" ("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Selesai. Verifikasi cepat (opsional, uncomment jika mau):
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'Sale' AND column_name = 'invoiceGroupId';
-- SELECT * FROM information_schema.tables WHERE table_name = 'InvoiceGroup';
