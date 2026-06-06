-- CreateEnum
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('unpaid', 'partial', 'paid');

-- CreateTable
CREATE TABLE "InvoiceGroup" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "manualInvoiceCode" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(14,2) NOT NULL,
    "paymentStatus" "InvoicePaymentStatus" NOT NULL DEFAULT 'unpaid',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceGroup_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "invoiceGroupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceGroup_manualInvoiceCode_key" ON "InvoiceGroup"("manualInvoiceCode");

-- CreateIndex
CREATE INDEX "InvoiceGroup_customerId_idx" ON "InvoiceGroup"("customerId");

-- CreateIndex
CREATE INDEX "InvoiceGroup_invoiceDate_idx" ON "InvoiceGroup"("invoiceDate");

-- CreateIndex
CREATE INDEX "InvoiceGroup_paymentStatus_idx" ON "InvoiceGroup"("paymentStatus");

-- CreateIndex
CREATE INDEX "Sale_invoiceGroupId_idx" ON "Sale"("invoiceGroupId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_invoiceGroupId_fkey" FOREIGN KEY ("invoiceGroupId") REFERENCES "InvoiceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceGroup" ADD CONSTRAINT "InvoiceGroup_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
