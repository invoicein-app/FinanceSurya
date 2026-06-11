"use client";

import { AppNavLink } from "@/components/app-nav-link";
import { useState } from "react";
import { Banknote } from "lucide-react";

import {
  DashboardTableArea,
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
import {
  InvoicePaymentModal,
  type InvoicePaymentModalTarget,
} from "@/components/invoices/invoice-payment-modal";
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

export type InvoiceGroupListRow = {
  id: string;
  manualInvoiceCode: string;
  invoiceDate: string;
  customerName: string;
  saleCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
};

type InvoiceGroupsTableProps = {
  initialRows: InvoiceGroupListRow[];
};

export function InvoiceGroupsTable({ initialRows }: InvoiceGroupsTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [paymentTarget, setPaymentTarget] = useState<InvoicePaymentModalTarget | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const openPaymentModal = (row: InvoiceGroupListRow) => {
    setPaymentTarget({
      id: row.id,
      manualInvoiceCode: row.manualInvoiceCode,
      customerName: row.customerName,
      totalAmount: row.totalAmount,
      paidAmount: row.paidAmount,
      remainingAmount: row.remainingAmount,
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (result: {
    invoiceGroupId: string;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
  }) => {
    setRows((current) =>
      current.map((row) =>
        row.id === result.invoiceGroupId
          ? {
              ...row,
              paidAmount: result.paidAmount,
              remainingAmount: result.remainingAmount,
              paymentStatus: result.paymentStatus,
            }
          : row,
      ),
    );
    setPaymentModalOpen(false);
    setPaymentTarget(null);
  };

  return (
    <>
      <DashboardTableArea>
        <Table>
          <TableHeader>
            <TableRow className={TABLE_HEADER_ROW_CLASS}>
              <TableHead className={TABLE_HEAD_CLASS}>Kode Invoice</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Tanggal</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Customer</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-center")}>Penjualan</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Total</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Dibayar</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Sisa</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>Status</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className={TABLE_EMPTY_CELL}>
                  Tidak ada invoice group yang cocok dengan filter. Buat dari halaman Penjualan.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((group) => {
                const isFullyPaid =
                  group.paymentStatus === "paid" || group.remainingAmount <= 0;

                return (
                  <TableRow key={group.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_DEFAULT}>
                      <AppNavLink
                        href={`/invoices/${group.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {group.manualInvoiceCode}
                      </AppNavLink>
                    </TableCell>
                    <TableCell className={TABLE_CELL_DATE}>
                      {new Date(group.invoiceDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className={TABLE_CELL_VENDOR}>{group.customerName}</TableCell>
                    <TableCell className={cn(TABLE_CELL_NUMERIC, "text-center")}>
                      {group.saleCount}
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {group.totalAmount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {group.paidAmount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {group.remainingAmount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={group.paymentStatus} />
                    </TableCell>
                    <TableCell className={TABLE_CELL_ACTIONS}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5 shadow-sm"
                          disabled={isFullyPaid}
                          title={
                            isFullyPaid
                              ? "Invoice sudah lunas"
                              : "Catat pelunasan tanpa buka detail"
                          }
                          onClick={() => openPaymentModal(group)}
                        >
                          <Banknote className="size-3.5" />
                          Pelunasan
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

      <InvoicePaymentModal
        open={paymentModalOpen}
        target={paymentTarget}
        onClose={() => {
          setPaymentModalOpen(false);
          setPaymentTarget(null);
        }}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
