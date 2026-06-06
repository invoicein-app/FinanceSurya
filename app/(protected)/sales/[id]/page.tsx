import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Pencil } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import {
  DashboardTableArea,
  FormSectionCard,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_MUTED,
  TABLE_CELL_NUMERIC,
  TABLE_CELL_PRIMARY,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { SaleDeleteButton } from "@/components/sales/sale-delete-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSaleById } from "@/lib/services/sale-service";
import { cn } from "@/lib/utils";

type SaleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const { id } = await params;
  const sale = await getSaleById(id);

  if (!sale) {
    notFound();
  }

  const customerLabel = sale.customer?.name ?? sale.customerName ?? "-";

  return (
    <AppListPage
      title="Detail Penjualan"
      description={`${new Date(sale.saleDate).toLocaleDateString("id-ID")} · ${customerLabel}`}
      icon={FileText}
      actions={
        <>
          <Button asChild className="shadow-sm">
            <Link href={`/sales/${sale.id}/edit`}>
              <Pencil className="size-4" />
              Edit Penjualan
            </Link>
          </Button>
          <SaleDeleteButton
            saleId={sale.id}
            label={`${new Date(sale.saleDate).toLocaleDateString("id-ID")} — ${customerLabel}`}
          />
          <Button asChild variant="outline" className="bg-card shadow-sm">
            <Link href="/sales">Kembali ke Daftar</Link>
          </Button>
        </>
      }
    >
      <FormSectionCard title="Informasi Transaksi" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Customer
            </p>
            <p className="mt-1 font-medium">{customerLabel}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tanggal
            </p>
            <p className="mt-1 font-medium">
              {new Date(sale.saleDate).toLocaleDateString("id-ID")}
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Invoice Group
            </p>
            {sale.invoiceGroup ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Link
                  href={`/invoices/${sale.invoiceGroup.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {sale.invoiceGroup.manualInvoiceCode}
                </Link>
                <InvoiceStatusBadge status={sale.invoiceGroup.paymentStatus} />
              </div>
            ) : (
              <p className="mt-1 text-muted-foreground">Belum masuk invoice group</p>
            )}
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Catatan
            </p>
            <p className="mt-1">{sale.note || "—"}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Grand total
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              Rp {Number(sale.grandTotal).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </FormSectionCard>

      <DataListCard title="Item Penjualan" description="Baris item dan alokasi sumber partai.">
        <DashboardTableArea>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                  <TableHead className={TABLE_HEAD_CLASS}>Deskripsi Item</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Qty</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Harga</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Subtotal</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Sumber Partai</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.saleItems.map((item) => (
                  <TableRow key={item.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_PRIMARY}>{item.itemName}</TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {Number(item.qty).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      Rp {Number(item.price).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {Number(item.subtotal).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={cn(TABLE_CELL_DEFAULT, "whitespace-normal")}>
                      {item.sources.length === 0 ? (
                        <span className="text-muted-foreground">Tanpa sumber partai</span>
                      ) : (
                        <div className="space-y-1">
                          {item.sources.map((source) => (
                            <p key={source.id} className="text-xs">
                              {source.thicknessStock ? (
                                <>
                                  {source.thicknessStock.purchase.batchCode} — ketebalan{" "}
                                  {source.thicknessStock.thicknessMm.toString()} mm — qty{" "}
                                  {Number(source.qtyTaken).toLocaleString("id-ID")}
                                </>
                              ) : source.purchaseItem ? (
                                <>
                                  {source.purchaseItem.purchase.batchCode} / Kapling{" "}
                                  {source.purchaseItem.noKapling} (alokasi lama) — qty{" "}
                                  {Number(source.qtyTaken).toLocaleString("id-ID")} — vol{" "}
                                  {Number(source.volumeTaken).toLocaleString("id-ID")}
                                </>
                              ) : (
                                <span className="text-muted-foreground">Sumber tidak lengkap</span>
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>{item.note || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </DashboardTableArea>
      </DataListCard>
    </AppListPage>
  );
}
