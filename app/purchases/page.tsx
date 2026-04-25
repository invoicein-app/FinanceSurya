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
import { getWoodPurchases } from "@/lib/services/wood-purchase-service";

export default async function PurchasesPage() {
  const purchases = await getWoodPurchases();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Daftar Partai Pembelian Kayu</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/purchases/new">Tambah Partai</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Dashboard</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembelian Partai</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kode Batch</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada data partai pembelian.
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {new Date(purchase.purchaseDate).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>{purchase.batchCode}</TableCell>
                    <TableCell>{purchase.vendor.name}</TableCell>
                    <TableCell>{purchase.items.length}</TableCell>
                    <TableCell className="text-right">
                      Rp {Number(purchase.grandTotal).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/purchases/${purchase.id}`}>Detail</Link>
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
