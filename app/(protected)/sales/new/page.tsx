import { AppNavLink } from "@/components/app-nav-link";
import { LayoutDashboard, PlusCircle } from "lucide-react";

import { createSaleAction } from "@/app/sales/actions";
import { AppListPage } from "@/components/layout/app-list-page";
import { FormSectionCard } from "@/components/layout/app-theme-ui";
import { SaleForm } from "@/components/sales/sale-form";
import { Button } from "@/components/ui/button";
import { getCustomers } from "@/lib/services/customer-service";
import { getThicknessStockOptionsForSaleForm } from "@/lib/services/wood-purchase-service";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const [customers, thicknessStockOptions] = await Promise.all([
    getCustomers(),
    getThicknessStockOptionsForSaleForm(),
  ]);

  return (
    <AppListPage
      title="Transaksi Penjualan Baru"
      description="Input penjualan veneer dan alokasi partai."
      icon={PlusCircle}
      actions={
        <>
          <Button asChild variant="outline" className="bg-card shadow-sm">
            <AppNavLink href="/sales">Riwayat Penjualan</AppNavLink>
          </Button>
          <Button asChild variant="outline" className="bg-card shadow-sm">
            <AppNavLink href="/">
              <LayoutDashboard className="size-4" />
              Dashboard
            </AppNavLink>
          </Button>
        </>
      }
    >
      <FormSectionCard title="Form Penjualan">
          {customers.length === 0 ? (
            <div className="space-y-2 text-sm">
              <p className="text-destructive">
                Belum ada master customer. Tambahkan customer terlebih dulu.
              </p>
              <Button asChild variant="outline" size="sm">
                <AppNavLink href="/customers">Buka Master Customer</AppNavLink>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {thicknessStockOptions.length === 0 ? (
                <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Belum ada baris stok per ketebalan di partai — penjualan tetap bisa disimpan
                  (alokasi sumber opsional). Tambahkan stok nanti di{" "}
                  <AppNavLink className="font-medium text-primary underline" href="/purchases">
                    detail partai
                  </AppNavLink>
                  ; saldo bisa sementara minus sampai diisi.
                </p>
              ) : null}
              <SaleForm
                customers={customers}
                thicknessStockOptions={thicknessStockOptions}
                action={createSaleAction}
                submitLabel="Simpan Penjualan"
              />
            </div>
          )}
      </FormSectionCard>
    </AppListPage>
  );
}
