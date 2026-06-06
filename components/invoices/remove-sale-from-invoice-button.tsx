"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Unlink } from "lucide-react";

import { removeSaleFromInvoiceGroupAction } from "@/app/sales/invoice-group-actions";
import { Button } from "@/components/ui/button";

type RemoveSaleFromInvoiceButtonProps = {
  saleId: string;
  saleLabel: string;
};

export function RemoveSaleFromInvoiceButton({
  saleId,
  saleLabel,
}: RemoveSaleFromInvoiceButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);

    const result = await removeSaleFromInvoiceGroupAction(saleId);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOpen(false);
    if (result.groupDeleted) {
      router.push("/invoices");
      router.refresh();
      return;
    }

    router.refresh();
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-300"
        onClick={() => setOpen(true)}
      >
        <Unlink className="size-3.5" />
        Lepas
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
            aria-labelledby="ungroup-sale-title"
            className="w-full max-w-md rounded-xl border border-border/70 bg-background p-6 shadow-xl ring-1 ring-foreground/10"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="ungroup-sale-title" className="text-lg font-semibold">
              Lepas dari invoice group?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Penjualan <span className="font-medium text-foreground">{saleLabel}</span> akan
              dikeluarkan dari invoice ini. Penjualan tetap ada dan bisa dipilih untuk invoice group
              lain.
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
                disabled={submitting}
                onClick={() => void handleConfirm()}
              >
                {submitting ? "Memproses…" : "Ya, lepas penjualan"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
