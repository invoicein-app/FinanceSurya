"use client";

import { useEffect, useState } from "react";
import { Banknote } from "lucide-react";

import { recordInvoiceGroupPaymentAction } from "@/app/sales/invoice-group-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { Textarea } from "@/components/ui/textarea";

export type InvoicePaymentModalTarget = {
  id: string;
  manualInvoiceCode: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

type InvoicePaymentModalProps = {
  open: boolean;
  target: InvoicePaymentModalTarget | null;
  onClose: () => void;
  onSuccess: (result: {
    invoiceGroupId: string;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
  }) => void;
};

export function InvoicePaymentModal({
  open,
  target,
  onClose,
  onSuccess,
}: InvoicePaymentModalProps) {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !target) {
      return;
    }
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setAmount(String(Math.max(0, Math.round(target.remainingAmount))));
    setNotes("");
    setErrorMessage(null);
    setSubmitting(false);
  }, [open, target?.id, target?.remainingAmount]);

  if (!open || !target) {
    return null;
  }

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Jumlah pelunasan wajib lebih dari 0.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const result = await recordInvoiceGroupPaymentAction({
      invoiceGroupId: target.id,
      paymentDate,
      amount: numericAmount,
      notes: notes.trim() || undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    onSuccess({
      invoiceGroupId: target.id,
      paidAmount: result.paidAmount,
      remainingAmount: result.remainingAmount,
      paymentStatus: result.paymentStatus,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-payment-title"
        className="w-full max-w-md rounded-xl border border-border/70 bg-background p-6 shadow-xl ring-1 ring-foreground/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Banknote className="size-5" />
          </div>
          <div>
            <h2 id="invoice-payment-title" className="text-lg font-semibold">
              Input Pelunasan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {target.manualInvoiceCode} · {target.customerName}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm">
          <p>
            Total tagihan:{" "}
            <span className="font-semibold">
              Rp {target.totalAmount.toLocaleString("id-ID")}
            </span>
          </p>
          <p>
            Sudah dibayar:{" "}
            <span className="font-semibold text-primary">
              Rp {target.paidAmount.toLocaleString("id-ID")}
            </span>
          </p>
          <p>
            Sisa tagihan:{" "}
            <span className="font-semibold">
              Rp {target.remainingAmount.toLocaleString("id-ID")}
            </span>
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Tanggal pelunasan</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Jumlah pelunasan (Rp)</Label>
            <RupiahInput
              id="paymentAmount"
              value={amount}
              onValueChange={setAmount}
              required
              disabled={submitting}
              aria-describedby="paymentAmountHint"
            />
            <p id="paymentAmountHint" className="text-xs text-muted-foreground">
              Maksimum Rp {target.remainingAmount.toLocaleString("id-ID")}. Pelunasan melebihi sisa
              tagihan akan ditolak.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentNotes">Catatan</Label>
            <Textarea
              id="paymentNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Opsional"
              disabled={submitting}
            />
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" disabled={submitting} onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="shadow-sm">
              {submitting ? "Menyimpan…" : "Simpan pelunasan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
