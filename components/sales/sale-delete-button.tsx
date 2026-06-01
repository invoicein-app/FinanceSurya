"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteSaleAction } from "@/app/sales/actions";
import { Button } from "@/components/ui/button";

type SaleDeleteButtonProps = {
  saleId: string;
  label: string;
  redirectTo?: string;
};

export function SaleDeleteButton({
  saleId,
  label,
  redirectTo = "/sales",
}: SaleDeleteButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeConfirm = () => {
    if (isDeleting) {
      return;
    }
    setConfirmOpen(false);
    setErrorMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteSaleAction(saleId);
      setConfirmOpen(false);
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menghapus transaksi penjualan.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setConfirmOpen(true)}>
        Hapus
      </Button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={closeConfirm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-sale-detail-title"
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-sale-detail-title" className="text-lg font-semibold">
              Hapus Penjualan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Yakin ingin menghapus transaksi penjualan ini? Stok partai yang sudah dialokasikan
              akan dikembalikan.
            </p>
            <p className="mt-1 text-sm font-medium">{label}</p>

            {errorMessage ? (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={isDeleting} onClick={closeConfirm}>
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => void handleConfirmDelete()}
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
