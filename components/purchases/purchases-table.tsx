"use client";

import Link from "next/link";
import { useState } from "react";

import { deletePurchaseAction } from "@/app/purchases/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PurchaseListRow = {
  id: string;
  purchaseDate: string;
  batchCode: string;
  vendorName: string;
  itemCount: number;
  detailVolume: number;
  grandTotal: number;
};

type PurchasesTableProps = {
  initialRows: PurchaseListRow[];
};

type ConfirmTarget = {
  id: string;
  batchCode: string;
};

export function PurchasesTable({ initialRows }: PurchasesTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openDeleteConfirm = (row: PurchaseListRow) => {
    if (deletingId) {
      return;
    }
    setErrorMessage(null);
    setConfirmTarget({ id: row.id, batchCode: row.batchCode });
  };

  const closeDeleteConfirm = () => {
    if (deletingId) {
      return;
    }
    setConfirmTarget(null);
    setErrorMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget || deletingId) {
      return;
    }

    const targetId = confirmTarget.id;
    setDeletingId(targetId);
    setErrorMessage(null);

    try {
      await deletePurchaseAction(targetId);
      setRows((current) => current.filter((row) => row.id !== targetId));
      setConfirmTarget(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menghapus data partai.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {errorMessage && !confirmTarget ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <Table className="w-auto max-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Kode Batch</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right tabular-nums">Jumlah item</TableHead>
            <TableHead className="text-right tabular-nums">Volume detail</TableHead>
            <TableHead className="text-right tabular-nums">Grand Total</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Belum ada data partai pembelian.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((purchase) => {
              const isDeleting = deletingId === purchase.id;

              return (
                <TableRow key={purchase.id}>
                  <TableCell>
                    {new Date(purchase.purchaseDate).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{purchase.batchCode}</TableCell>
                  <TableCell>{purchase.vendorName}</TableCell>
                  <TableCell className="text-right tabular-nums">{purchase.itemCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {purchase.detailVolume.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    Rp {purchase.grandTotal.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/purchases/${purchase.id}`}>Detail</Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={Boolean(deletingId)}
                        onClick={() => openDeleteConfirm(purchase)}
                      >
                        {isDeleting ? "Menghapus..." : "Hapus"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {confirmTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={closeDeleteConfirm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-partai-title"
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-partai-title" className="text-lg font-semibold">
              Hapus Partai
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Yakin ingin menghapus data partai ini?
            </p>
            <p className="mt-1 text-sm font-medium">{confirmTarget.batchCode}</p>

            {errorMessage ? (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(deletingId)}
                onClick={closeDeleteConfirm}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={Boolean(deletingId)}
                onClick={() => void handleConfirmDelete()}
              >
                {deletingId === confirmTarget.id ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
