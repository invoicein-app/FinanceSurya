import Link from "next/link";
import { LayoutDashboard, Package, Plus } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import { PurchasesTable } from "@/components/purchases/purchases-table";
import { Button } from "@/components/ui/button";
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
    <AppListPage
      title="Daftar Partai Pembelian Kayu"
      icon={Package}
      actions={
        <>
          <Button asChild className="gap-1.5 shadow-sm">
            <Link href="/purchases/new">
              <Plus className="size-4" />
              Tambah Partai
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
            <Link href="/">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </Button>
        </>
      }
    >
      <DataListCard
        title="Riwayat Pembelian Partai"
        description="Semua batch pembelian kayu beserta ringkasan volume dan nilai."
      >
        <PurchasesTable initialRows={rows} />
      </DataListCard>
    </AppListPage>
  );
}
