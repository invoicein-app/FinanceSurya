import { AppNavLink } from "@/components/app-nav-link";
import { notFound } from "next/navigation";
import { LayoutDashboard, Package, Pencil } from "lucide-react";

import { updatePurchaseAction } from "@/app/purchases/actions";
import { AppListPage } from "@/components/layout/app-list-page";
import { FormSectionCard } from "@/components/layout/app-theme-ui";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { Button } from "@/components/ui/button";
import { getVendors } from "@/lib/services/vendor-service";
import { getWoodPurchaseById } from "@/lib/services/wood-purchase-service";
import { formatPartaiLabel } from "@/lib/partai/format-partai-label";

type EditPurchasePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPurchasePage({ params }: EditPurchasePageProps) {
  const { id } = await params;
  const [purchase, vendors] = await Promise.all([
    getWoodPurchaseById(id),
    getVendors(),
  ]);

  if (!purchase) {
    notFound();
  }

  const updateAction = updatePurchaseAction.bind(null, purchase.id);
  const partaiLabel = formatPartaiLabel(purchase);
  const defaultBatchYear =
    purchase.batchYear ?? new Date(purchase.purchaseDate).getFullYear();

  return (
    <AppListPage
      title="Edit Partai Pembelian"
      description={`${partaiLabel} · ${purchase.vendor.name}`}
      icon={Pencil}
      actions={
        <>
          <Button asChild variant="outline" className="bg-card shadow-sm">
            <AppNavLink href={`/purchases/${purchase.id}`}>Detail Partai</AppNavLink>
          </Button>
          <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
            <AppNavLink href="/purchases">
              <Package className="size-4" />
              Daftar Partai
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
      <FormSectionCard title="Form Edit Partai">
        <PurchaseForm
          vendors={vendors}
          action={updateAction}
          submitLabel="Simpan Perubahan"
          initialValues={{
            vendorId: purchase.vendorId,
            purchaseDate: purchase.purchaseDate.toISOString().slice(0, 10),
            batchCode: purchase.batchCode,
            batchYear: defaultBatchYear,
            woodSpecies: purchase.woodSpecies ?? "",
            documentNumber: purchase.documentNumber || "",
            note: purchase.note || "",
            bpCost: Number(purchase.bpCost),
            cuttingCost: Number(purchase.cuttingCost),
            shippingCost: Number(purchase.shippingCost),
            woodPrice: Number(purchase.woodPrice ?? 0),
            items: purchase.items.map((item) => ({
              rowId: item.id,
              itemId: item.id,
              woodType: item.woodType,
              length: item.length?.toString() || "",
              diameter: item.diameter?.toString() || "",
              volume: item.volume.toString(),
              mutu: item.mutu || "",
              note: item.note || "",
            })),
          }}
        />
      </FormSectionCard>
    </AppListPage>
  );
}
