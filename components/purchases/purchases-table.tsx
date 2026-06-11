"use client";

import { AppNavLink } from "@/components/app-nav-link";
import { useMemo, useState } from "react";
import { Eye, Trash2 } from "lucide-react";

import { deletePurchaseAction } from "@/app/purchases/actions";
import { useMutationLoading } from "@/lib/hooks/use-mutation-loading";
import {
  DashboardTableArea,
  DataTableLink,
  TABLE_ACTION_BTN_DELETE,
  TABLE_ACTION_BTN_VIEW,
  TABLE_ALERT_BANNER,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_ACTIONS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DATE,
  TABLE_CELL_NUMERIC,
  TABLE_CELL_PRIMARY,
  TABLE_CELL_VENDOR,
  TABLE_EMPTY_CELL,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { TableListFooter } from "@/components/layout/table-list-footer";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type PurchaseListRow = {
  id: string;
  purchaseDate: string;
  batchCode: string;
  batchYear: number | null;
  woodSpecies: string | null;
  partaiLabel: string;
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
  partaiLabel: string;
};

export function PurchasesTable({ initialRows }: PurchasesTableProps) {
  const { wrapDelete } = useMutationLoading();
  const [rows, setRows] = useState(initialRows);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, rows.length);

  const openDeleteConfirm = (row: PurchaseListRow) => {
    if (deletingId) {
      return;
    }
    setErrorMessage(null);
    setConfirmTarget({ id: row.id, partaiLabel: row.partaiLabel });
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
      await wrapDelete(() => deletePurchaseAction(targetId));
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
        <p className={TABLE_ALERT_BANNER}>{errorMessage}</p>
      ) : null}

      <DashboardTableArea>
        <Table>
          <TableHeader>
            <TableRow className={TABLE_HEADER_ROW_CLASS}>
              <TableHead className={TABLE_HEAD_CLASS}>Tanggal</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Identitas Partai</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Tahun</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Jenis Kayu</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Vendor</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Jumlah item</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Volume</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Grand Total</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className={TABLE_EMPTY_CELL}>
                  Belum ada data partai pembelian.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((purchase) => {
                const isDeleting = deletingId === purchase.id;

                return (
                  <TableRow key={purchase.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_DATE}>
                      {new Date(purchase.purchaseDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className={TABLE_CELL_PRIMARY}>
                      <DataTableLink href={`/purchases/${purchase.id}`}>
                        {purchase.partaiLabel}
                      </DataTableLink>
                      <p className="mt-0.5 text-xs text-muted-foreground">{purchase.batchCode}</p>
                    </TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {purchase.batchYear ?? "—"}
                    </TableCell>
                    <TableCell className={TABLE_CELL_VENDOR}>
                      {purchase.woodSpecies?.trim() || "—"}
                    </TableCell>
                    <TableCell className={TABLE_CELL_VENDOR}>{purchase.vendorName}</TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>{purchase.itemCount}</TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {purchase.detailVolume.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {purchase.grandTotal.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_ACTIONS}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className={TABLE_ACTION_BTN_VIEW}
                        >
                          <AppNavLink href={`/purchases/${purchase.id}`}>
                            <Eye className="size-3.5" />
                            Detail
                          </AppNavLink>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={TABLE_ACTION_BTN_DELETE}
                          disabled={Boolean(deletingId)}
                          onClick={() => openDeleteConfirm(purchase)}
                        >
                          <Trash2 className="size-3.5" />
                          {isDeleting ? "..." : "Hapus"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </DashboardTableArea>

      <TableListFooter
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={rows.length}
        entityLabel="partai"
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

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
            className="w-full max-w-md rounded-xl border border-border/70 bg-background p-6 shadow-xl ring-1 ring-foreground/10"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-partai-title" className="text-lg font-semibold">
              Hapus Partai
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Yakin ingin menghapus data partai ini?
            </p>
            <p className="mt-1 text-sm font-medium">{confirmTarget.partaiLabel}</p>

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
