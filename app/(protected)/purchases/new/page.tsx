import { AppNavLink } from "@/components/app-nav-link";
import { LayoutDashboard, Package, PlusCircle } from "lucide-react";

import { createPurchaseAction } from "@/app/purchases/actions";
import { AppListPage } from "@/components/layout/app-list-page";
import { FormSectionCard } from "@/components/layout/app-theme-ui";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { Button } from "@/components/ui/button";
import { getVendors } from "@/lib/services/vendor-service";

export default async function NewPurchasePage() {
  const vendors = await getVendors();

  return (
    <AppListPage
      title="Tambah Partai Pembelian"
      description="Input batch pembelian kayu dan baris log."
      icon={PlusCircle}
      actions={
        <>
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
      <FormSectionCard title="Form Partai Pembelian">
        {vendors.length === 0 ? (
          <div className="space-y-2 text-sm">
            <p className="text-destructive">
              Belum ada vendor. Tambahkan vendor dulu sebelum input pembelian.
            </p>
            <Button asChild size="sm" variant="outline">
              <AppNavLink href="/vendors">Buka Master Vendor</AppNavLink>
            </Button>
          </div>
        ) : (
          <PurchaseForm
            vendors={vendors}
            action={createPurchaseAction}
            submitLabel="Simpan Partai"
          />
        )}
      </FormSectionCard>
    </AppListPage>
  );
}
