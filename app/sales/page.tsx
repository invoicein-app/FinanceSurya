import Link from "next/link";

import { SalesTable } from "@/components/sales/sales-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSales } from "@/lib/services/sale-service";

export default async function SalesPage() {
  const sales = await getSales();

  const rows = sales.map((sale) => ({
    id: sale.id,
    saleDate: sale.saleDate.toISOString(),
    customerLabel: sale.customer?.name ?? sale.customerName ?? "-",
    itemCount: sale.saleItems.length,
    sourceCount: sale.saleItems.reduce((sum, item) => sum + item.sources.length, 0),
    firstItemName: sale.saleItems[0]?.itemName || "-",
    grandTotal: Number(sale.grandTotal),
  }));

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
          <SalesTable initialRows={rows} />
        </CardContent>
      </Card>
    </main>
  );
}
