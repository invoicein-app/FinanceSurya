import Link from "next/link";
import { LayoutDashboard, Users } from "lucide-react";

import { createCustomerAction } from "@/app/customers/actions";
import { CustomersTable } from "@/components/customers/customers-table";
import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import { FormSectionCard } from "@/components/layout/app-theme-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCustomers } from "@/lib/services/customer-service";

type CustomersPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const customers = await getCustomers();
  const duplicateName = params.error === "duplicate";

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <AppListPage
      title="Master Customer"
      icon={Users}
      actions={
        <Button asChild variant="outline" className="gap-1.5 bg-card shadow-sm">
          <Link href="/">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </Button>
      }
    >
      <FormSectionCard title="Tambah Customer" className="mb-6">
        {duplicateName ? (
          <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Nama customer sudah dipakai. Gunakan nama lain, atau edit customer yang sudah ada di
            daftar bawah.
          </p>
        ) : null}
        <form
          action={createCustomerAction}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="w-full flex-1 space-y-2">
            <Label htmlFor="name">Nama Customer</Label>
            <Input id="name" name="name" placeholder="Toko Barokah" required className="max-w-xl" />
          </div>
          <Button type="submit" className="shrink-0 shadow-sm sm:min-w-[7rem]">
            Simpan
          </Button>
        </form>
      </FormSectionCard>

      <DataListCard
        title="Daftar Customer"
        description="Kelola nama customer untuk transaksi penjualan."
      >
        <CustomersTable initialRows={rows} />
      </DataListCard>
    </AppListPage>
  );
}
