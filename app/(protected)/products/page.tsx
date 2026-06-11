import { AppNavLink } from "@/components/app-nav-link";
import { Boxes, LayoutDashboard } from "lucide-react";

import { createProductAction } from "@/app/products/actions";
import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import {
  DashboardTableArea,
  FormSectionCard,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_MUTED,
  TABLE_CELL_PRIMARY,
  TABLE_EMPTY_CELL,
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
import { getProducts } from "@/lib/services/product-service";
import { cn } from "@/lib/utils";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <AppListPage
      title="Master Produk Kayu"
      icon={Boxes}
      actions={
        <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
          <AppNavLink href="/">
            <LayoutDashboard className="size-4" />
            Dashboard
          </AppNavLink>
        </Button>
      }
    >
      <FormSectionCard title="Tambah Produk Baru" className="mb-6">
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
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" className="shadow-sm">
              Simpan Produk
            </Button>
          </div>
        </form>
      </FormSectionCard>

      <DataListCard title="Daftar Produk" description="Katalog produk kayu dan harga default.">
        <DashboardTableArea>
          <Table>
            <TableHeader>
              <TableRow className={TABLE_HEADER_ROW_CLASS}>
                <TableHead className={TABLE_HEAD_CLASS}>Kode</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Nama</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Kategori</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Ukuran</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Satuan</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Harga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className={TABLE_EMPTY_CELL}>
                    Belum ada produk.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={cn(TABLE_CELL_MUTED, "font-mono text-xs")}>
                      {product.code}
                    </TableCell>
                    <TableCell className={TABLE_CELL_PRIMARY}>{product.name}</TableCell>
                    <TableCell className={TABLE_CELL_DEFAULT}>{product.category}</TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>{product.size}</TableCell>
                    <TableCell className={TABLE_CELL_DEFAULT}>{product.unit}</TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {Number(product.defaultPrice).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DashboardTableArea>
      </DataListCard>
    </AppListPage>
  );
}
