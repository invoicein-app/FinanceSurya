"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, FileStack, Trash2 } from "lucide-react";

import { deleteSaleAction } from "@/app/sales/actions";
import {
  DashboardTableArea,
  TABLE_ACTION_BTN_DELETE,
  TABLE_ACTION_BTN_VIEW,
  TABLE_ALERT_BANNER,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_ACTIONS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DATE,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_NUMERIC,
  TABLE_CELL_VENDOR,
  TABLE_EMPTY_CELL,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { TableListFooter } from "@/components/layout/table-list-footer";
import { CreateInvoiceGroupModal } from "@/components/sales/create-invoice-group-modal";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
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

export type SaleListRow = {
  id: string;
  saleDate: string;
  customerId: string | null;
  customerLabel: string;
  itemCount: number;
  sourceCount: number;
  firstItemName: string;
  partaiLabels: string[];
  grandTotal: number;
  invoiceGroupId: string | null;
  invoiceGroupCode: string | null;
  invoiceGroupPaymentStatus: string | null;
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const selectablePageRows = pageRows.filter((row) => !row.invoiceGroupId);

  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, rows.length);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds],
  );

  const selectedCustomerId = selectedRows[0]?.customerId ?? null;
  const selectionMixedCustomer = selectedRows.some(
    (row) => row.customerId !== selectedCustomerId,
  );
  const selectionHasUngroupedOnly = selectedRows.every((row) => !row.invoiceGroupId);
  const canCreateInvoice =
    selectedRows.length >= 1 &&
    selectionHasUngroupedOnly &&
    !selectionMixedCustomer &&
    Boolean(selectedCustomerId);

  const toggleRow = (row: SaleListRow, checked: boolean) => {
    if (row.invoiceGroupId) {
      return;
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(row.id);
      } else {
        next.delete(row.id);
      }
      return next;
    });
  };

  const togglePageSelection = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const row of selectablePageRows) {
        if (checked) {
          next.add(row.id);
        } else {
          next.delete(row.id);
        }
      }
      return next;
    });
  };

  const pageAllSelected =
    selectablePageRows.length > 0 &&
    selectablePageRows.every((row) => selectedIds.has(row.id));

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
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(targetId);
        return next;
      });
      setConfirmTarget(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menghapus transaksi penjualan.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleInvoiceGroupSuccess = (result: {
    saleIds: string[];
    invoiceGroupId: string;
    manualInvoiceCode: string;
  }) => {
    setRows((current) =>
      current.map((row) =>
        result.saleIds.includes(row.id)
          ? {
              ...row,
              invoiceGroupId: result.invoiceGroupId,
              invoiceGroupCode: result.manualInvoiceCode,
              invoiceGroupPaymentStatus: "unpaid",
            }
          : row,
      ),
    );
    setSelectedIds(new Set());
    setInvoiceModalOpen(false);
  };

  return (
    <>
      {selectedRows.length > 0 ? (
        <div className="flex flex-col gap-3 border-b border-[var(--table-border)] bg-[var(--table-footer)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{selectedRows.length}</span> penjualan
            dipilih
            {selectedRows[0] ? (
              <>
                {" "}
                · Customer:{" "}
                <span className="font-medium text-foreground">{selectedRows[0].customerLabel}</span>
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
            >
              Batal pilih
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 shadow-sm"
              disabled={!canCreateInvoice}
              onClick={() => setInvoiceModalOpen(true)}
            >
              <FileStack className="size-3.5" />
              Gabungkan ke Invoice
            </Button>
          </div>
        </div>
      ) : null}

      {selectionMixedCustomer && selectedRows.length > 0 ? (
        <p className={TABLE_ALERT_BANNER}>
          Penjualan yang dipilih harus dari customer yang sama sebelum digabung ke invoice.
        </p>
      ) : null}

      {errorMessage && !confirmTarget ? (
        <p className={TABLE_ALERT_BANNER}>{errorMessage}</p>
      ) : null}

      <DashboardTableArea>
        <Table>
          <TableHeader>
            <TableRow className={TABLE_HEADER_ROW_CLASS}>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-10 px-3")}>
                <input
                  type="checkbox"
                  className="size-4 rounded border-input accent-primary"
                  checked={pageAllSelected}
                  disabled={selectablePageRows.length === 0}
                  aria-label="Pilih semua penjualan di halaman ini"
                  onChange={(e) => togglePageSelection(e.target.checked)}
                />
              </TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Tanggal</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Customer</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Invoice</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Partai</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-center")}>Jumlah Item</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-center")}>
                Jumlah Sumber Partai
              </TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Ringkasan Item</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Grand Total</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className={TABLE_EMPTY_CELL}>
                  Belum ada transaksi penjualan.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((sale) => {
                const isDeleting = deletingId === sale.id;
                const isGrouped = Boolean(sale.invoiceGroupId);
                const isSelected = selectedIds.has(sale.id);

                return (
                  <TableRow
                    key={sale.id}
                    className={cn(
                      TABLE_BODY_ROW_CLASS,
                      isGrouped && "bg-muted/15",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    <TableCell className="w-10 px-3 py-4">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-input accent-primary disabled:opacity-40"
                        checked={isSelected}
                        disabled={isGrouped || !sale.customerId}
                        title={
                          isGrouped
                            ? "Sudah masuk invoice group"
                            : !sale.customerId
                              ? "Penjualan tanpa master customer"
                              : "Pilih untuk invoice group"
                        }
                        aria-label={`Pilih penjualan ${sale.customerLabel}`}
                        onChange={(e) => toggleRow(sale, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className={TABLE_CELL_DATE}>
                      {new Date(sale.saleDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className={TABLE_CELL_VENDOR}>{sale.customerLabel}</TableCell>
                    <TableCell className={TABLE_CELL_DEFAULT}>
                      {sale.invoiceGroupCode ? (
                        <div className="flex flex-col gap-1.5">
                          <Link
                            href={`/invoices/${sale.invoiceGroupId}`}
                            className="inline-flex max-w-[180px] items-center gap-1 truncate font-semibold text-primary hover:underline"
                            title={sale.invoiceGroupCode}
                          >
                            <FileStack className="size-3.5 shrink-0" />
                            {sale.invoiceGroupCode}
                          </Link>
                          {sale.invoiceGroupPaymentStatus ? (
                            <InvoiceStatusBadge
                              status={sale.invoiceGroupPaymentStatus}
                              className="w-fit text-[10px]"
                            />
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className={cn(TABLE_CELL_DEFAULT, "max-w-[200px] whitespace-normal")}>
                      {sale.partaiLabels.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1" title={sale.partaiLabels.join(", ")}>
                          {sale.partaiLabels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-xs font-medium text-foreground"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={cn(TABLE_CELL_NUMERIC, "text-center")}>
                      {sale.itemCount}
                    </TableCell>
                    <TableCell className={cn(TABLE_CELL_NUMERIC, "text-center")}>
                      {sale.sourceCount}
                    </TableCell>
                    <TableCell className={cn(TABLE_CELL_DEFAULT, "max-w-[240px] whitespace-normal")}>
                      <span className="line-clamp-2" title={sale.firstItemName}>
                        {sale.firstItemName}
                      </span>
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {sale.grandTotal.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_ACTIONS}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className={TABLE_ACTION_BTN_VIEW}
                        >
                          <Link href={`/sales/${sale.id}`}>
                            <Eye className="size-3.5" />
                            Detail
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={TABLE_ACTION_BTN_DELETE}
                          disabled={Boolean(deletingId)}
                          onClick={() => openDeleteConfirm(sale)}
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
        entityLabel="data"
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <CreateInvoiceGroupModal
        open={invoiceModalOpen}
        selectedRows={selectedRows}
        onClose={() => setInvoiceModalOpen(false)}
        onSuccess={handleInvoiceGroupSuccess}
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
            aria-labelledby="delete-sale-title"
            className="w-full max-w-md rounded-xl border border-border/70 bg-background p-6 shadow-xl ring-1 ring-foreground/10"
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
