import { AppNavLink } from "@/components/app-nav-link";
import { notFound } from "next/navigation";
import { LayoutDashboard, Package, Pencil } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { PartaiAnalysisSummary } from "@/components/purchases/partai-analysis-summary";
import { PartaiItemsSection } from "@/components/purchases/partai-items-section";
import { PartaiPurchaseHeaderCard } from "@/components/purchases/partai-purchase-header-card";
import { PartaiRelatedSalesSection } from "@/components/purchases/partai-related-sales-section";
import { PartaiThicknessStockSection } from "@/components/purchases/partai-thickness-stock-section";
import { Button } from "@/components/ui/button";
import {
  aggregatePartaiVeneerOutputAnalytics,
  computePartaiPurchaseAnalytics,
  getPartaiRelatedSaleUsages,
  getPartaiTransferOptions,
  getWoodPurchaseById,
} from "@/lib/services/wood-purchase-service";
import { formatPartaiLabel } from "@/lib/partai/format-partai-label";

type PurchaseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const { id } = await params;
  const [purchase, relatedSales, transferOptions] = await Promise.all([
    getWoodPurchaseById(id),
    getPartaiRelatedSaleUsages(id),
    getPartaiTransferOptions(id),
  ]);

  if (!purchase) {
    notFound();
  }

  const purchaseAnalytics = computePartaiPurchaseAnalytics(purchase);
  const veneerAnalytics = aggregatePartaiVeneerOutputAnalytics(relatedSales.rows);
  const partaiLabel = formatPartaiLabel(purchase);

  return (
    <AppListPage
      title={partaiLabel}
      description={`Partai pembelian · ${purchase.vendor.name}`}
      icon={Package}
      actions={
        <>
          <Button asChild className="gap-1.5 shadow-sm">
            <AppNavLink href={`/purchases/${purchase.id}/edit`}>
              <Pencil className="size-4" />
              Edit Partai
            </AppNavLink>
          </Button>
          <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
            <AppNavLink href="/purchases">Daftar Partai</AppNavLink>
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
      <PartaiPurchaseHeaderCard
        purchase={purchase}
        purchaseAnalytics={purchaseAnalytics}
      />

      <div className="mt-6">
        <PartaiItemsSection items={purchase.items} />
      </div>

      <section className="mt-8 space-y-8">
        <PartaiAnalysisSummary
          purchaseAnalytics={purchaseAnalytics}
          veneerAnalytics={veneerAnalytics}
        />

        <PartaiThicknessStockSection
          purchaseId={purchase.id}
          thicknessStocks={purchase.thicknessStocks}
        />

        <PartaiRelatedSalesSection
          currentPurchaseId={purchase.id}
          currentPartaiLabel={partaiLabel}
          data={relatedSales}
          transferOptions={transferOptions}
        />
      </section>
    </AppListPage>
  );
}
