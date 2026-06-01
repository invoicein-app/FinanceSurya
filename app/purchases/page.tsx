import Link from "next/link";

import { PurchasesTable } from "@/components/purchases/purchases-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getWoodPurchases,
  sumWoodPurchaseDetailVolume,
} from "@/lib/services/wood-purchase-service";

export default async function PurchasesPage() {
  const purchases = await getWoodPurchases();

  const rows = purchases.map((purchase) => ({
    id: purchase.id,
    purchaseDate: purchase.purchaseDate.toISOString(),
    batchCode: purchase.batchCode,
    vendorName: purchase.vendor.name,
    itemCount: purchase.items.length,
    detailVolume: sumWoodPurchaseDetailVolume(purchase.items),
    grandTotal: Number(purchase.grandTotal),
  }));

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
          <PurchasesTable initialRows={rows} />
        </CardContent>
      </Card>
    </main>
  );
}
