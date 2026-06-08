import Link from "next/link";
import { LayoutDashboard, Warehouse } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import {
  DashboardTableArea,
  DataTableLink,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_MUTED,
  TABLE_CELL_NUMERIC,
  TABLE_CELL_PRIMARY,
  TABLE_CELL_VENDOR,
  TABLE_EMPTY_CELL,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBatchStock, getThicknessStockLedger } from "@/lib/services/stock-service";
import { formatPartaiLabel } from "@/lib/partai/format-partai-label";
import { cn } from "@/lib/utils";

export default async function StocksPage() {
  const [thicknessRows, logRows] = await Promise.all([
    getThicknessStockLedger(),
    getBatchStock(),
  ]);

  return (
    <AppListPage
      title="Stok Sisa"
      description="Sisa stok veneer per ketebalan dan baris log partai (model lama)."
      icon={Warehouse}
      actions={
        <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
          <Link href="/">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </Button>
      }
    >
      <DataListCard
        title="Stok veneer per partai & ketebalan"
        description="Saldo per batch dan ketebalan untuk alokasi penjualan."
        className="mb-6"
      >
        {thicknessRows.length === 0 ? (
          <p className={TABLE_EMPTY_CELL}>Belum ada baris stok per ketebalan. Tambahkan dari halaman detail partai pembelian.</p>
        ) : (
          <DashboardTableArea>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                  <TableHead className={TABLE_HEAD_CLASS}>Partai</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Vendor</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Ketebalan (mm)</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Sisa qty</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Satuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thicknessRows.map((row) => {
                  const qtyRem = Number(row.qtyAvailable);
                  const isNegative = qtyRem < 0;
                  return (
                    <TableRow key={row.id} className={TABLE_BODY_ROW_CLASS}>
                      <TableCell className={TABLE_CELL_PRIMARY}>
                        <DataTableLink href={`/purchases/${row.purchase.id}`}>
                          {formatPartaiLabel(row.purchase)}
                        </DataTableLink>
                      </TableCell>
                      <TableCell className={TABLE_CELL_VENDOR}>{row.purchase.vendor.name}</TableCell>
                      <TableCell className={TABLE_CELL_NUMERIC}>{row.thicknessMm.toString()}</TableCell>
                      <TableCell
                        className={cn(
                          TABLE_CELL_AMOUNT,
                          "text-[0.875rem]",
                          isNegative && "text-destructive",
                        )}
                      >
                        {qtyRem.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className={TABLE_CELL_MUTED}>{row.unit ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DashboardTableArea>
        )}
      </DataListCard>

      <DataListCard
        title="Baris log / volume partai"
        description="Model lama — tidak dipakai untuk alokasi penjualan baru per ketebalan."
        badge="Legacy"
      >
        <DashboardTableArea>
          <Table>
            <TableHeader>
              <TableRow className={TABLE_HEADER_ROW_CLASS}>
                <TableHead className={TABLE_HEAD_CLASS}>Partai</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Vendor</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>No Kapling</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Jenis Kayu</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Vol Awal</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Sisa Qty</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Sisa Vol</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logRows.map((item) => {
                const qtyRem = Number(item.remainingQty);
                const volRem = Number(item.remainingVolume);
                const status =
                  qtyRem < 0 || volRem < 0
                    ? "anomaly"
                    : qtyRem === 0 && volRem === 0
                      ? "habis"
                      : qtyRem <= 1 || volRem <= 1
                        ? "menipis"
                        : "aman";

                return (
                  <TableRow key={item.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_PRIMARY}>
                      {formatPartaiLabel(item.purchase)}
                    </TableCell>
                    <TableCell className={TABLE_CELL_VENDOR}>{item.purchase.vendor.name}</TableCell>
                    <TableCell className={TABLE_CELL_DEFAULT}>{item.noKapling}</TableCell>
                    <TableCell className={TABLE_CELL_DEFAULT}>{item.woodType}</TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {Number(item.volume).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {qtyRem.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {volRem.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={cn(TABLE_CELL_DEFAULT, "capitalize")}>{status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DashboardTableArea>
      </DataListCard>
    </AppListPage>
  );
}
