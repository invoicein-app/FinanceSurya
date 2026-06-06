-- CreateTable
CREATE TABLE "InvoiceGroupPayment" (
    "id" TEXT NOT NULL,
    "invoiceGroupId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceGroupPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceGroupPayment_invoiceGroupId_idx" ON "InvoiceGroupPayment"("invoiceGroupId");

-- CreateIndex
CREATE INDEX "InvoiceGroupPayment_paymentDate_idx" ON "InvoiceGroupPayment"("paymentDate");

-- AddForeignKey
ALTER TABLE "InvoiceGroupPayment" ADD CONSTRAINT "InvoiceGroupPayment_invoiceGroupId_fkey" FOREIGN KEY ("invoiceGroupId") REFERENCES "InvoiceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
