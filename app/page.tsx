import { Badge } from "@/components/ui/badge";
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
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Home() {
  const dbResult = await (async () => {
    try {
      const purchases = await prisma.woodPurchase.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          vendor: true,
        },
      });

      return {
        status: "connected" as const,
        message: "",
        purchases,
      };
    } catch (error: unknown) {
      return {
        status: "error" as const,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi error tidak dikenal saat koneksi database.",
        purchases: [],
      };
    }
  })();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-xl">Dashboard Awal Penjualan Kayu</CardTitle>
          <Badge
            variant={
              dbResult.status === "connected" ? "default" : "destructive"
            }
          >
            {dbResult.status === "connected" ? "DB Connected" : "DB Error"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Aplikasi ini memakai arsitektur stok berbasis partai pembelian kayu.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <Link href="/vendors">Master Vendor</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/customers">Master Customer</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/purchases">Daftar Partai</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/purchases/new">Input Partai Baru</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/sales">Daftar Penjualan</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/sales/new">Input Penjualan</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/stocks">Stok Sisa Partai</Link>
            </Button>
          </div>
          {dbResult.status === "error" && (
            <p className="text-destructive">
              Gagal konek ke database: {dbResult.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partai Pembelian Terbaru (maks 5)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbResult.purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada data partai pembelian.
                  </TableCell>
                </TableRow>
              ) : (
                dbResult.purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {new Date(purchase.purchaseDate).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>{purchase.batchCode}</TableCell>
                    <TableCell>{purchase.vendor.name}</TableCell>
                    <TableCell className="text-right">
                      Rp {Number(purchase.grandTotal).toLocaleString("id-ID")}
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
