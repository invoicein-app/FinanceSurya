import Link from "next/link";
import { PlusCircle, Tag } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import {
  FormSectionCard,
  PageEmptyState,
  SELECT_FIELD_CLASS,
  DashboardTableArea,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DATE,
  TABLE_CELL_MUTED,
  TABLE_CELL_PRIMARY,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
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
import { getCustomerPriceListForPage } from "@/lib/services/customer-price-list-service";
import { getCustomers } from "@/lib/services/customer-service";
import { cn } from "@/lib/utils";

type PriceListPageProps = {
  searchParams: Promise<{ customerId?: string; q?: string }>;
};

export default async function PriceListPage({ searchParams }: PriceListPageProps) {
  const params = await searchParams;
  const customers = await getCustomers();
  const customerId = params.customerId ?? "";
  const q = params.q?.trim() ?? "";

  const rows = customerId
    ? await getCustomerPriceListForPage({
        customerId,
        search: q || undefined,
      })
    : [];

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <AppListPage
      title="Price List per Customer"
      description="Daftar harga terakhir otomatis dari histori penjualan."
      icon={Tag}
      actions={
        <Button asChild className="gap-1.5 shadow-sm">
          <Link href="/sales/new">
            <PlusCircle className="size-4" />
            Input Penjualan
          </Link>
        </Button>
      }
    >
      <FormSectionCard title="Filter" className="mb-6">
        <form
          action="/price-list"
          method="get"
          className="flex flex-col gap-4 md:flex-row md:items-end"
        >
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <select
              id="customerId"
              name="customerId"
              className={SELECT_FIELD_CLASS}
              defaultValue={customerId}
            >
              <option value="">— Pilih customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="q">Cari nama item</Label>
            <Input id="q" name="q" placeholder="Contoh: veneer" defaultValue={q} />
          </div>
          <Button type="submit" className="shrink-0 shadow-sm">
            Tampilkan
          </Button>
        </form>
        {customers.length === 0 ? (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Belum ada master customer. Tambahkan di menu Master Customer.
          </p>
        ) : null}
      </FormSectionCard>

      {!customerId ? (
        <PageEmptyState>Pilih customer lalu klik Tampilkan untuk melihat price list.</PageEmptyState>
      ) : rows.length === 0 ? (
        <PageEmptyState>
          Belum ada data price list untuk customer ini. Terisi otomatis setelah ada transaksi
          penjualan.
        </PageEmptyState>
      ) : (
        <DataListCard
          title={
            selectedCustomer
              ? `Item & harga terakhir — ${selectedCustomer.name}`
              : "Item & harga terakhir"
          }
        >
          <DashboardTableArea>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                  <TableHead className={TABLE_HEAD_CLASS}>Nama item</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Mutu</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Tebal</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Lebar</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Panjang</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Satuan</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Harga</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_PRIMARY}>{row.itemName}</TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>{row.category ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>{row.thickness ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>{row.width ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>{row.length ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>{row.unit ?? "—"}</TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {Number(row.latestPrice).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_DATE}>
                      {row.lastSaleDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DashboardTableArea>
        </DataListCard>
      )}
    </AppListPage>
  );
}
