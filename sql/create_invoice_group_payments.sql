-- =============================================================================
-- SuryaFinance — Riwayat pelunasan Invoice Group
-- =============================================================================
-- Jalankan di Supabase SQL Editor setelah create_invoice_groups.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS "InvoiceGroupPayment" (
  "id" TEXT NOT NULL,
  "invoiceGroupId" TEXT NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(14, 2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceGroupPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InvoiceGroupPayment_invoiceGroupId_idx"
  ON "InvoiceGroupPayment" ("invoiceGroupId");

CREATE INDEX IF NOT EXISTS "InvoiceGroupPayment_paymentDate_idx"
  ON "InvoiceGroupPayment" ("paymentDate");

DO $$
BEGIN
  ALTER TABLE "InvoiceGroupPayment"
    ADD CONSTRAINT "InvoiceGroupPayment_invoiceGroupId_fkey"
    FOREIGN KEY ("invoiceGroupId")
    REFERENCES "InvoiceGroup" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
