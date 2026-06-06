"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FileStack } from "lucide-react";

import { createInvoiceGroupAction } from "@/app/sales/invoice-group-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaleListRow } from "@/components/sales/sales-table";

type CreateInvoiceGroupModalProps = {
  open: boolean;
  selectedRows: SaleListRow[];
  onClose: () => void;
  onSuccess: (result: {
    saleIds: string[];
    invoiceGroupId: string;
    manualInvoiceCode: string;
  }) => void;
};

export function CreateInvoiceGroupModal({
  open,
  selectedRows,
  onClose,
  onSuccess,
}: CreateInvoiceGroupModalProps) {
  const router = useRouter();
  const [manualInvoiceCode, setManualInvoiceCode] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = useMemo(
    () => selectedRows.reduce((sum, row) => sum + row.grandTotal, 0),
    [selectedRows],
  );

  const customerLabel = selectedRows[0]?.customerLabel ?? "-";

  if (!open) {
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

    setSubmitting(true);
    setErrorMessage(null);

    const result = await createInvoiceGroupAction({
      saleIds: selectedRows.map((row) => row.id),
      manualInvoiceCode,
      invoiceDate,
      notes: notes.trim() || undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    onSuccess({
      saleIds: selectedRows.map((row) => row.id),
      invoiceGroupId: result.invoiceGroupId,
      manualInvoiceCode: result.manualInvoiceCode,
    });
    setManualInvoiceCode("");
    setNotes("");
    router.refresh();
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
        aria-labelledby="create-invoice-group-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border/70 bg-background p-6 shadow-xl ring-1 ring-foreground/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileStack className="size-5" />
          </span>
          <div>
            <h2 id="create-invoice-group-title" className="text-lg font-semibold">
              Buat Invoice Group
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gabungkan {selectedRows.length} penjualan dari{" "}
              <strong className="text-foreground">{customerLabel}</strong>. Kode invoice diisi
              manual agar sama dengan aplikasi invoicing Anda.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm">
          <p className="text-muted-foreground">
            Total tagihan:{" "}
            <span className="font-bold tabular-nums text-foreground">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manualInvoiceCode">Kode invoice (manual)</Label>
            <Input
              id="manualInvoiceCode"
              value={manualInvoiceCode}
              onChange={(e) => setManualInvoiceCode(e.target.value)}
              placeholder="Contoh: INV/2026/0042"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Kode harus unik. Tidak dibuat otomatis — salin persis dari sistem invoice Anda.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceDate">Tanggal invoice</Label>
            <Input
              id="invoiceDate"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceNotes">Catatan (opsional)</Label>
            <Input
              id="invoiceNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan internal tagihan"
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={submitting} onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="shadow-sm">
              {submitting ? "Menyimpan…" : "Simpan Invoice Group"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
