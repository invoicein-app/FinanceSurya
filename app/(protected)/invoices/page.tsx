import { AppNavLink } from "@/components/app-nav-link";
import { FileStack, LayoutDashboard } from "lucide-react";
import type { InvoicePaymentStatus } from "@prisma/client";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import { FormSectionCard, SELECT_FIELD_CLASS } from "@/components/layout/app-theme-ui";
import { InvoiceGroupsTable } from "@/components/invoices/invoice-groups-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCustomers } from "@/lib/services/customer-service";
import { getInvoiceGroups } from "@/lib/services/invoice-group-service";

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

  const rows = groups.map((group) => ({
    id: group.id,
    manualInvoiceCode: group.manualInvoiceCode,
    invoiceDate: group.invoiceDate.toISOString(),
    customerName: group.customer.name,
    saleCount: group._count.sales,
    totalAmount: Number(group.totalAmount),
    paidAmount: Number(group.paidAmount),
    remainingAmount: Number(group.remainingAmount),
    paymentStatus: group.paymentStatus,
  }));

  return (
    <AppListPage
      title="Invoice Group"
      description="Tagihan gabungan penjualan dengan kode invoice manual untuk pelacakan piutang."
      icon={FileStack}
      actions={
        <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
          <AppNavLink href="/sales">
            <LayoutDashboard className="size-4" />
            Daftar Penjualan
          </AppNavLink>
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
                <AppNavLink href="/invoices">Reset</AppNavLink>
              </Button>
            )}
          </div>
        </form>
      </FormSectionCard>

      <DataListCard
        title="Daftar Invoice Group"
        description={`${groups.length} invoice group ditampilkan. Klik Pelunasan untuk catat pembayaran langsung dari list.`}
      >
        <InvoiceGroupsTable initialRows={rows} />
      </DataListCard>
    </AppListPage>
  );
}
