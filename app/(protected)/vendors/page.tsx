import Link from "next/link";
import { LayoutDashboard, Truck } from "lucide-react";

import { createVendorAction } from "@/app/vendors/actions";
import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import { FormSectionCard } from "@/components/layout/app-theme-ui";
import { VendorsTable } from "@/components/vendors/vendors-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVendors } from "@/lib/services/vendor-service";

export default async function VendorsPage() {
  const vendors = await getVendors();
  const rows = vendors.map((v) => ({ id: v.id, name: v.name }));

  return (
    <AppListPage
      title="Master Vendor"
      icon={Truck}
      actions={
        <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
          <Link href="/">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </Button>
      }
    >
      <FormSectionCard title="Tambah Vendor" className="mb-6">
        <form action={createVendorAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full flex-1 space-y-2">
            <Label htmlFor="name">Nama Vendor</Label>
            <Input id="name" name="name" placeholder="PT Kayu Nusantara" required className="max-w-xl" />
          </div>
          <Button type="submit" className="shrink-0 shadow-sm sm:min-w-[7rem]">
            Simpan
          </Button>
        </form>
      </FormSectionCard>

      <DataListCard
        title="Daftar Vendor"
        description="Kelola nama vendor untuk partai pembelian kayu."
      >
        <VendorsTable initialRows={rows} />
      </DataListCard>
    </AppListPage>
  );
}
