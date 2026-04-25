import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBatchStock, getThicknessStockLedger } from "@/lib/services/stock-service";

export default async function StocksPage() {
  const [thicknessRows, logRows] = await Promise.all([
    getThicknessStockLedger(),
    getBatchStock(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stok</h1>
        <Button asChild variant="outline">
          <Link href="/">Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stok veneer per partai &amp; ketebalan</CardTitle>
        </CardHeader>
        <CardContent>
          {thicknessRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada baris stok per ketebalan. Tambahkan dari halaman detail partai pembelian.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Ketebalan (mm)</TableHead>
                  <TableHead>Sisa qty</TableHead>
                  <TableHead>Satuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thicknessRows.map((row) => {
                  const qtyRem = Number(row.qtyAvailable);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.purchase.batchCode}</TableCell>
                      <TableCell>{row.purchase.vendor.name}</TableCell>
                      <TableCell>{row.thicknessMm.toString()}</TableCell>
                      <TableCell>{qtyRem.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{row.unit ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Baris log / volume partai (model lama)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Data pembelian per baris log; tidak dipakai untuk alokasi penjualan baru per ketebalan.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>No Kapling</TableHead>
                <TableHead>Jenis Kayu</TableHead>
                <TableHead>Vol Awal</TableHead>
                <TableHead>Sisa Qty</TableHead>
                <TableHead>Sisa Vol</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableRow key={item.id}>
                    <TableCell>{item.purchase.batchCode}</TableCell>
                    <TableCell>{item.purchase.vendor.name}</TableCell>
                    <TableCell>{item.noKapling}</TableCell>
                    <TableCell>{item.woodType}</TableCell>
                    <TableCell>{Number(item.volume).toLocaleString("id-ID")}</TableCell>
                    <TableCell>{qtyRem.toLocaleString("id-ID")}</TableCell>
                    <TableCell>{volRem.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="capitalize">{status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
