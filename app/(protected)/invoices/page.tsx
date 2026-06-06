import Link from "next/link";
import { FileStack, LayoutDashboard } from "lucide-react";
import type { InvoicePaymentStatus } from "@prisma/client";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import {
  DashboardTableArea,
  FormSectionCard,
  SELECT_FIELD_CLASS,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DATE,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_NUMERIC,
  TABLE_CELL_VENDOR,
  TABLE_EMPTY_CELL,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomers } from "@/lib/services/customer-service";
import { getInvoiceGroups } from "@/lib/services/invoice-group-service";
import { cn } from "@/lib/utils";

type InvoicesPageProps = {
  searchParams: Promise<{
    code?: string;
    customerId?: string;
    paymentStatus?: string;
  }>;
};

const PAYMENT_STATUS_OPTIONS: Array<{ value: InvoicePaymentStatus | ""; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "unpaid", label: "Belum lunas" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Lunas" },
];

function parsePaymentStatus(value: string | undefined): InvoicePaymentStatus | undefined {
  if (value === "unpaid" || value === "partial" || value === "paid") {
    return value;
  }
  return undefined;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const code = params.code?.trim() ?? "";
  const customerId = params.customerId ?? "";
  const paymentStatus = parsePaymentStatus(params.paymentStatus);

  const [groups, customers] = await Promise.all([
    getInvoiceGroups({
      code: code || undefined,
      customerId: customerId || undefined,
      paymentStatus,
    }),
    getCustomers(),
  ]);

  return (
    <AppListPage
      title="Invoice Group"
      description="Tagihan gabungan penjualan dengan kode invoice manual untuk pelacakan piutang."
      icon={FileStack}
      actions={
        <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
          <Link href="/sales">
            <LayoutDashboard className="size-4" />
            Daftar Penjualan
          </Link>
        </Button>
      }
    >
      <FormSectionCard title="Filter" className="mb-6">
        <form
          action="/invoices"
          method="get"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="code">Kode invoice</Label>
            <Input
              id="code"
              name="code"
              placeholder="Contoh: INV-2024-001"
              defaultValue={code}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <select
              id="customerId"
              name="customerId"
              className={SELECT_FIELD_CLASS}
              defaultValue={customerId}
            >
              <option value="">Semua customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Status pembayaran</Label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              className={SELECT_FIELD_CLASS}
              defaultValue={paymentStatus ?? ""}
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="shadow-sm">
              Terapkan filter
            </Button>
            {(code || customerId || paymentStatus) && (
              <Button asChild type="button" variant="outline" className="bg-card">
                <Link href="/invoices">Reset</Link>
              </Button>
            )}
          </div>
        </form>
      </FormSectionCard>

      <DataListCard
        title="Daftar Invoice Group"
        description={`${groups.length} invoice group${groups.length === 1 ? "" : ""} ditampilkan.`}
      >
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className={TABLE_EMPTY_CELL}>
                    Tidak ada invoice group yang cocok dengan filter. Buat dari halaman Penjualan.
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_DEFAULT}>
                      <Link
                        href={`/invoices/${group.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {group.manualInvoiceCode}
                      </Link>
                    </TableCell>
                    <TableCell className={TABLE_CELL_DATE}>
                      {group.invoiceDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className={TABLE_CELL_VENDOR}>{group.customer.name}</TableCell>
                    <TableCell className={cn(TABLE_CELL_NUMERIC, "text-center")}>
                      {group._count.sales}
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {Number(group.totalAmount).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {Number(group.paidAmount).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {Number(group.remainingAmount).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={group.paymentStatus} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DashboardTableArea>
      </DataListCard>
    </AppListPage>
  );
}
