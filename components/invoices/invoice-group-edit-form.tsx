"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateInvoiceGroupAction } from "@/app/sales/invoice-group-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InvoiceGroupEditFormProps = {
  invoiceGroupId: string;
  manualInvoiceCode: string;
  invoiceDate: string;
  notes: string;
  paidAmount: number;
  totalAmount: number;
};

function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function InvoiceGroupEditForm({
  invoiceGroupId,
  manualInvoiceCode,
  invoiceDate,
  notes,
  paidAmount,
  totalAmount,
}: InvoiceGroupEditFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(manualInvoiceCode);
  const [date, setDate] = useState(toDateInputValue(invoiceDate));
  const [notesValue, setNotesValue] = useState(notes);
  const [paid, setPaid] = useState(paidAmount.toString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await updateInvoiceGroupAction({
      invoiceGroupId,
      manualInvoiceCode: code,
      invoiceDate: date,
      notes: notesValue,
      paidAmount: Number(paid),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Invoice group berhasil diperbarui.");
    router.refresh();
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="manualInvoiceCode">Kode invoice manual</Label>
          <Input
            id="manualInvoiceCode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceDate">Tanggal invoice</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paidAmount">Jumlah sudah dibayar (Rp)</Label>
          <Input
            id="paidAmount"
            type="number"
            min={0}
            step="0.01"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Total tagihan Rp {totalAmount.toLocaleString("id-ID")}. Status otomatis dihitung setelah
            simpan.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea
            id="notes"
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            rows={2}
            placeholder="Opsional"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? <p className="text-sm text-primary">{success}</p> : null}

      <Button type="submit" disabled={submitting} className="shadow-sm">
        {submitting ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
