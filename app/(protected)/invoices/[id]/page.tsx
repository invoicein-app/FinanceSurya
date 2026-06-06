import Link from "next/link";
import { notFound } from "next/navigation";
import { FileStack } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import { FormSectionCard } from "@/components/layout/app-theme-ui";
import {
  DashboardTableArea,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DATE,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_MUTED,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { CopyInvoiceCode } from "@/components/invoices/copy-invoice-code";
import { InvoiceGroupDeleteButton } from "@/components/invoices/invoice-group-delete-button";
import { InvoiceGroupEditForm } from "@/components/invoices/invoice-group-edit-form";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { RemoveSaleFromInvoiceButton } from "@/components/invoices/remove-sale-from-invoice-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInvoiceGroupById, paymentStatusLabel } from "@/lib/services/invoice-group-service";
import { cn } from "@/lib/utils";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatPartaiSource(source: {
  qtyTaken: unknown;
  volumeTaken: unknown;
  purchaseItem: {
    noKapling: string;
    purchase: { batchCode: string };
  } | null;
  thicknessStock: {
    thicknessMm: unknown;
    purchase: { batchCode: string };
  } | null;
}): string {
  if (source.thicknessStock) {
    return `${source.thicknessStock.purchase.batchCode} — ketebalan ${String(source.thicknessStock.thicknessMm)} mm — qty ${Number(source.qtyTaken).toLocaleString("id-ID")}`;
  }
  if (source.purchaseItem) {
    return `${source.purchaseItem.purchase.batchCode} / Kapling ${source.purchaseItem.noKapling} — qty ${Number(source.qtyTaken).toLocaleString("id-ID")}`;
  }
  return "Sumber tidak lengkap";
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const group = await getInvoiceGroupById(id);

  if (!group) {
    notFound();
  }

  const invoiceDateLabel = group.invoiceDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AppListPage
      title="Detail Invoice Group"
      description={`${group.customer.name} · ${invoiceDateLabel}`}
      icon={FileStack}
      actions={
        <>
          <Button asChild variant="outline" className="bg-card shadow-sm">
            <Link href="/invoices">Daftar Invoice</Link>
          </Button>
          <Button asChild variant="outline" className="bg-card shadow-sm">
            <Link href="/sales">Penjualan</Link>
          </Button>
        </>
      }
    >
      <FormSectionCard title="Kode invoice (salin ke aplikasi invoicing)" className="mb-6">
        <CopyInvoiceCode code={group.manualInvoiceCode} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <InvoiceStatusBadge status={group.paymentStatus} />
          <span className="text-sm text-muted-foreground">
            {paymentStatusLabel(group.paymentStatus)} · {group.sales.length} penjualan
          </span>
        </div>
      </FormSectionCard>

      <FormSectionCard title="Ringkasan tagihan" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Customer
            </p>
            <p className="mt-1 font-medium">{group.customer.name}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tanggal invoice
            </p>
            <p className="mt-1 font-medium">{invoiceDateLabel}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status pembayaran
            </p>
            <div className="mt-2">
              <InvoiceStatusBadge status={group.paymentStatus} />
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3 sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Catatan
            </p>
            <p className="mt-1">{group.notes || "—"}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--table-card-border)] bg-card px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total tagihan
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              Rp {Number(group.totalAmount).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--table-card-border)] bg-card px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sudah dibayar
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-primary">
              Rp {Number(group.paidAmount).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--table-card-border)] bg-card px-4 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sisa tagihan
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              Rp {Number(group.remainingAmount).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </FormSectionCard>

      <FormSectionCard title="Edit invoice & pembayaran" className="mb-6">
        <InvoiceGroupEditForm
          invoiceGroupId={group.id}
          manualInvoiceCode={group.manualInvoiceCode}
          invoiceDate={group.invoiceDate.toISOString()}
          notes={group.notes ?? ""}
          paidAmount={Number(group.paidAmount)}
          totalAmount={Number(group.totalAmount)}
        />
      </FormSectionCard>

      <DataListCard
        title="Penjualan dalam invoice ini"
        description="Detail partai tetap di masing-masing transaksi penjualan."
        className="mb-6"
      >
        <DashboardTableArea>
          <Table>
            <TableHeader>
              <TableRow className={TABLE_HEADER_ROW_CLASS}>
                <TableHead className={TABLE_HEAD_CLASS}>Tanggal</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Item & partai</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Grand Total</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.sales.map((sale) => {
                const saleDateLabel = sale.saleDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <TableRow key={sale.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_DATE}>{saleDateLabel}</TableCell>
                    <TableCell className={cn(TABLE_CELL_DEFAULT, "whitespace-normal")}>
                      <div className="space-y-3">
                        {sale.saleItems.map((item) => (
                          <div key={item.id}>
                            <p className="font-medium">{item.itemName}</p>
                            {item.sources.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Tanpa sumber partai</p>
                            ) : (
                              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                {item.sources.map((source) => (
                                  <li key={source.id}>{formatPartaiSource(source)}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {Number(sale.grandTotal).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/sales/${sale.id}`}>Detail</Link>
                        </Button>
                        <RemoveSaleFromInvoiceButton
                          saleId={sale.id}
                          saleLabel={`${saleDateLabel} · Rp ${Number(sale.grandTotal).toLocaleString("id-ID")}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DashboardTableArea>
      </DataListCard>

      <InvoiceGroupDeleteButton
        invoiceGroupId={group.id}
        manualInvoiceCode={group.manualInvoiceCode}
        saleCount={group.sales.length}
      />
    </AppListPage>
  );
}
