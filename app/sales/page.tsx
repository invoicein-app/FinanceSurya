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
import { getSales } from "@/lib/services/sale-service";

export default async function SalesPage() {
  const sales = await getSales();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Riwayat Penjualan Kayu</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/sales/new">Tambah Penjualan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Dashboard</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead>Jumlah Sumber Partai</TableHead>
                <TableHead>Ringkasan Item</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Belum ada transaksi penjualan.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {new Date(sale.saleDate).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>{sale.customer?.name ?? sale.customerName ?? "-"}</TableCell>
                    <TableCell>{sale.saleItems.length}</TableCell>
                    <TableCell>
                      {sale.saleItems.reduce((sum, item) => sum + item.sources.length, 0)}
                    </TableCell>
                    <TableCell>{sale.saleItems[0]?.itemName || "-"}</TableCell>
                    <TableCell className="text-right">
                      Rp {Number(sale.grandTotal).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/sales/${sale.id}`}>Detail</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
