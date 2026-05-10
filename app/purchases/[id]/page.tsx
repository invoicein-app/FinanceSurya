import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addThicknessStockAction,
  deleteThicknessStockAction,
} from "@/app/purchases/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThicknessMmInput } from "@/components/thickness-mm-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getWoodPurchaseById,
  sumWoodPurchaseDetailVolume,
} from "@/lib/services/wood-purchase-service";

type PurchaseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const { id } = await params;
  const purchase = await getWoodPurchaseById(id);

  if (!purchase) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Detail Partai Pembelian</h1>
          <p className="text-sm text-muted-foreground">
            {purchase.batchCode} - {purchase.vendor.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/purchases/${purchase.id}/edit`}>Edit Partai</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/purchases">Kembali</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Header Pembelian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Tanggal:</span>{" "}
            {new Date(purchase.purchaseDate).toLocaleDateString("id-ID")}
          </p>
          <p>
            <span className="font-medium">Batch/Truk:</span> {purchase.batchCode}
          </p>
          <p>
            <span className="font-medium">Nomor Dokumen:</span>{" "}
            {purchase.documentNumber || "-"}
          </p>
          <p>
            <span className="font-medium">Catatan:</span> {purchase.note || "-"}
          </p>
          <p>
            <span className="font-medium">BP Cost:</span> Rp{" "}
            {Number(purchase.bpCost).toLocaleString("id-ID")}
          </p>
          <p>
            <span className="font-medium">Cutting Cost:</span> Rp{" "}
            {Number(purchase.cuttingCost).toLocaleString("id-ID")}
          </p>
          <p>
            <span className="font-medium">Shipping Cost:</span> Rp{" "}
            {Number(purchase.shippingCost).toLocaleString("id-ID")}
          </p>
          <p>
            <span className="font-medium">Harga Kayu:</span> Rp{" "}
            {Number(purchase.woodPrice ?? 0).toLocaleString("id-ID")}
          </p>
          <p className="text-lg font-semibold">
            Grand Total: Rp {Number(purchase.grandTotal).toLocaleString("id-ID")}
          </p>
          <p>
            <span className="font-medium">Total volume pembelian (Σ baris detail):</span>{" "}
            {sumWoodPurchaseDetailVolume(purchase.items).toLocaleString("id-ID")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stok veneer per ketebalan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Setiap partai otomatis punya baris <strong>0.6 mm</strong> dan <strong>1.2 mm</strong>{" "}
            dengan qty awal <strong>0</strong> (bisa Anda sesuaikan). Form di bawah untuk menambah
            ketebalan lain bila perlu. Kombinasi ini yang muncul saat penjualan. Untuk desimal gunakan{" "}
            <strong>titik</strong> (contoh: <strong>0.6</strong>), bukan koma.
          </p>
          <form action={addThicknessStockAction} className="grid gap-3 md:grid-cols-5 md:items-end">
            <input type="hidden" name="purchaseId" value={purchase.id} />
            <div className="space-y-2">
              <Label htmlFor="thicknessMm">Ketebalan (mm)</Label>
              <ThicknessMmInput id="thicknessMm" name="thicknessMm" required placeholder="0.6" />
              <p className="text-xs text-muted-foreground">Titik untuk desimal; koma tidak dipakai.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qtyInitial">Qty awal</Label>
              <Input
                id="qtyInitial"
                name="qtyInitial"
                type="number"
                step="0.01"
                min={0}
                required
                placeholder="100"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="unit">Satuan</Label>
              <Input id="unit" name="unit" placeholder="m2" defaultValue="m2" />
            </div>
            <div className="md:col-span-1">
              <Button type="submit" className="w-full md:w-auto">
                Tambah baris stok
              </Button>
            </div>
          </form>

          {purchase.thicknessStocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada baris stok per ketebalan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ketebalan (mm)</TableHead>
                  <TableHead>Sisa qty</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="w-[120px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.thicknessStocks.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.thicknessMm.toString()}</TableCell>
                    <TableCell>{Number(row.qtyAvailable).toLocaleString("id-ID")}</TableCell>
                    <TableCell>{row.unit ?? "—"}</TableCell>
                    <TableCell>
                      <form action={deleteThicknessStockAction}>
                        <input type="hidden" name="purchaseId" value={purchase.id} />
                        <input type="hidden" name="stockId" value={row.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Hapus
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Item Partai</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis Kayu</TableHead>
                <TableHead>Panjang</TableHead>
                <TableHead>Diameter</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>MUTU</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Sisa Qty</TableHead>
                <TableHead>Sisa Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.woodType}</TableCell>
                  <TableCell>{item.length?.toString() ?? "-"}</TableCell>
                  <TableCell>{item.diameter?.toString() ?? "-"}</TableCell>
                  <TableCell>{Number(item.volume).toLocaleString("id-ID")}</TableCell>
                  <TableCell>{item.mutu ?? "-"}</TableCell>
                  <TableCell>{item.note || "-"}</TableCell>
                  <TableCell>{Number(item.remainingQty).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    {Number(item.remainingVolume).toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
