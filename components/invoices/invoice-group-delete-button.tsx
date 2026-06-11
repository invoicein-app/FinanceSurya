"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteInvoiceGroupAction } from "@/app/sales/invoice-group-actions";
import { useMutationLoading } from "@/lib/hooks/use-mutation-loading";
import { Button } from "@/components/ui/button";

type InvoiceGroupDeleteButtonProps = {
  invoiceGroupId: string;
  manualInvoiceCode: string;
  saleCount: number;
};

export function InvoiceGroupDeleteButton({
  invoiceGroupId,
  manualInvoiceCode,
  saleCount,
}: InvoiceGroupDeleteButtonProps) {
  const router = useRouter();
  const { wrapDelete } = useMutationLoading();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await wrapDelete(() => deleteInvoiceGroupAction(invoiceGroupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membatalkan invoice group.");
      setSubmitting(false);
      router.refresh();
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-1.5 border-destructive/30 text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
        Batalkan invoice group
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-invoice-title"
            className="w-full max-w-md rounded-xl border border-border/70 bg-background p-6 shadow-xl ring-1 ring-foreground/10"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-invoice-title" className="text-lg font-semibold">
              Batalkan invoice group?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Invoice <span className="font-medium text-foreground">{manualInvoiceCode}</span> akan
              dihapus. {saleCount} penjualan terkait akan dilepas dan bisa digabung ke invoice lain.
              Data penjualan tidak dihapus.
            </p>

            {error ? (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={submitting}
                onClick={() => void handleConfirm()}
              >
                {submitting ? "Memproses…" : "Ya, batalkan group"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
