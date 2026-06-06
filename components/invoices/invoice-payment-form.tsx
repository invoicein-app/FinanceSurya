"use client";

import { useState } from "react";

import { updateInvoiceGroupPaymentAction } from "@/app/sales/invoice-group-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InvoicePaymentFormProps = {
  invoiceGroupId: string;
  paidAmount: number;
  totalAmount: number;
};

export function InvoicePaymentForm({
  invoiceGroupId,
  paidAmount,
  totalAmount,
}: InvoicePaymentFormProps) {
  const [value, setValue] = useState(paidAmount.toString());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("invoiceGroupId", invoiceGroupId);
    formData.set("paidAmount", value);

    try {
      await updateInvoiceGroupPaymentAction(formData);
      setMessage("Pembayaran berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memperbarui pembayaran.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="paidAmount">Jumlah sudah dibayar (Rp)</Label>
        <Input
          id="paidAmount"
          type="number"
          min={0}
          max={totalAmount}
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Maksimum Rp {totalAmount.toLocaleString("id-ID")}. Status otomatis: belum lunas / sebagian /
          lunas.
        </p>
      </div>
      <Button type="submit" disabled={submitting} className="shrink-0 shadow-sm">
        {submitting ? "Menyimpan…" : "Simpan pembayaran"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground sm:basis-full">{message}</p> : null}
    </form>
  );
}
