"use client";

import Link from "next/link";
import { useState } from "react";

import { deleteSaleAction } from "@/app/sales/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SaleListRow = {
  id: string;
  saleDate: string;
  customerLabel: string;
  itemCount: number;
  sourceCount: number;
  firstItemName: string;
  grandTotal: number;
};

type SalesTableProps = {
  initialRows: SaleListRow[];
};

type ConfirmTarget = {
  id: string;
  label: string;
};

export function SalesTable({ initialRows }: SalesTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openDeleteConfirm = (row: SaleListRow) => {
    if (deletingId) {
      return;
    }
    setErrorMessage(null);
    setConfirmTarget({
      id: row.id,
      label: `${new Date(row.saleDate).toLocaleDateString("id-ID")} — ${row.customerLabel}`,
    });
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
      await deleteSaleAction(targetId);
      setRows((current) => current.filter((row) => row.id !== targetId));
      setConfirmTarget(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menghapus transaksi penjualan.",
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Jumlah Item</TableHead>
            <TableHead>Jumlah Sumber Partai</TableHead>
            <TableHead>Ringkasan Item</TableHead>
            <TableHead className="text-right">Grand Total</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Belum ada transaksi penjualan.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((sale) => {
              const isDeleting = deletingId === sale.id;

              return (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.saleDate).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{sale.customerLabel}</TableCell>
                  <TableCell>{sale.itemCount}</TableCell>
                  <TableCell>{sale.sourceCount}</TableCell>
                  <TableCell>{sale.firstItemName}</TableCell>
                  <TableCell className="text-right">
                    Rp {sale.grandTotal.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/sales/${sale.id}`}>Detail</Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={Boolean(deletingId)}
                        onClick={() => openDeleteConfirm(sale)}
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
            aria-labelledby="delete-sale-title"
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-sale-title" className="text-lg font-semibold">
              Hapus Penjualan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Yakin ingin menghapus transaksi penjualan ini? Stok partai yang sudah dialokasikan akan
              dikembalikan.
            </p>
            <p className="mt-1 text-sm font-medium">{confirmTarget.label}</p>

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
