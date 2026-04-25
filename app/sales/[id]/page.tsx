import Link from "next/link";
import { notFound } from "next/navigation";

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
import { getSaleById } from "@/lib/services/sale-service";

type SaleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const { id } = await params;
  const sale = await getSaleById(id);

  if (!sale) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Detail Penjualan</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(sale.saleDate).toLocaleDateString("id-ID")} -{" "}
            {sale.customer?.name ?? sale.customerName ?? "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/sales/${sale.id}/edit`}>Edit Penjualan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sales">Kembali ke Daftar</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Customer:</span>{" "}
            {sale.customer?.name ?? sale.customerName ?? "-"}
          </p>
          <p>
            <span className="font-medium">Tanggal:</span>{" "}
            {new Date(sale.saleDate).toLocaleDateString("id-ID")}
          </p>
          <p>
            <span className="font-medium">Catatan:</span> {sale.note || "-"}
          </p>
          <p className="text-lg font-semibold">
            Grand Total: Rp {Number(sale.grandTotal).toLocaleString("id-ID")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Item Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Sumber Partai</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.saleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>
                    {Number(item.qty).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>Rp {Number(item.price).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    Rp {Number(item.subtotal).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
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
                  <TableCell>{item.note || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
