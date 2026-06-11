import { AppNavLink } from "@/components/app-nav-link";
import { FileText, LayoutDashboard, Plus } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import { SalesTable } from "@/components/sales/sales-table";
import { Button } from "@/components/ui/button";
import { getSales } from "@/lib/services/sale-service";
import { collectSalePartaiLabels } from "@/lib/sales/sale-batch-codes";

export default async function SalesPage() {
  const sales = await getSales();

  const rows = sales.map((sale) => ({
    id: sale.id,
    saleDate: sale.saleDate.toISOString(),
    customerId: sale.customerId,
    customerLabel: sale.customer?.name ?? sale.customerName ?? "-",
    itemCount: sale.saleItems.length,
    sourceCount: sale.saleItems.reduce((sum, item) => sum + item.sources.length, 0),
    firstItemName: sale.saleItems[0]?.itemName || "-",
    partaiLabels: collectSalePartaiLabels(sale),
    grandTotal: Number(sale.grandTotal),
    invoiceGroupId: sale.invoiceGroup?.id ?? null,
    invoiceGroupCode: sale.invoiceGroup?.manualInvoiceCode ?? null,
    invoiceGroupPaymentStatus: sale.invoiceGroup?.paymentStatus ?? null,
  }));

  return (
    <AppListPage
      title="Riwayat Penjualan Kayu"
      icon={FileText}
      actions={
        <>
          <Button asChild className="gap-1.5 shadow-sm">
            <AppNavLink href="/sales/new">
              <Plus className="size-4" />
              Tambah Penjualan
            </AppNavLink>
          </Button>
          <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
            <AppNavLink href="/">
              <LayoutDashboard className="size-4" />
              Dashboard
            </AppNavLink>
          </Button>
        </>
      }
    >
      <DataListCard
        title="Daftar Transaksi"
        description="Riwayat penjualan veneer dengan alokasi partai. Centang beberapa baris customer yang sama lalu gabungkan ke invoice manual."
      >
        <SalesTable initialRows={rows} />
      </DataListCard>
    </AppListPage>
  );
}
