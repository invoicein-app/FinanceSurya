import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createProductAction } from "@/app/products/actions";
import { getProducts } from "@/lib/services/product-service";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Master Produk Kayu</h1>
        <Button asChild variant="outline">
          <Link href="/">Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Produk Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProductAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Produk</Label>
              <Input id="code" name="code" placeholder="KY-JTI-005" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input id="name" name="name" placeholder="Kayu Jati 2x4" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" name="category" placeholder="Kayu Solid" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Ukuran</Label>
              <Input id="size" name="size" placeholder="2 x 4 x 400 cm" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Satuan</Label>
              <Input id="unit" name="unit" placeholder="batang" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPrice">Harga Default (Rp)</Label>
              <Input
                id="defaultPrice"
                name="defaultPrice"
                type="number"
                min={1}
                step="0.01"
                placeholder="120000"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Simpan Produk</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead className="text-right">Harga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.size}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell className="text-right">
                    Rp {Number(product.defaultPrice).toLocaleString("id-ID")}
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
