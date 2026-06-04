import Link from "next/link";
import { FileText, LayoutDashboard, Plus } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import { SalesTable } from "@/components/sales/sales-table";
import { Button } from "@/components/ui/button";
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
    <AppListPage
      title="Riwayat Penjualan Kayu"
      icon={FileText}
      actions={
        <>
          <Button asChild className="gap-1.5 shadow-sm">
            <Link href="/sales/new">
              <Plus className="size-4" />
              Tambah Penjualan
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
        title="Daftar Transaksi"
        description="Riwayat penjualan veneer dengan alokasi partai."
      >
        <SalesTable initialRows={rows} />
      </DataListCard>
    </AppListPage>
  );
}
