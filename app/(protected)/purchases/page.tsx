import Link from "next/link";
import { LayoutDashboard, Package, Plus } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import { FormSectionCard, SELECT_FIELD_CLASS } from "@/components/layout/app-theme-ui";
import { PurchasesTable } from "@/components/purchases/purchases-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPartaiLabel } from "@/lib/partai/format-partai-label";
import {
  filterWoodPurchasesList,
  getWoodPurchases,
  sumWoodPurchaseDetailVolume,
} from "@/lib/services/wood-purchase-service";

type PurchasesPageProps = {
  searchParams: Promise<{ year?: string; q?: string }>;
};

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const yearParam = params.year?.trim() ?? "";
  const batchYear = yearParam ? Number(yearParam) : undefined;
  const batchYearFilter =
    batchYear != null && Number.isFinite(batchYear) ? batchYear : undefined;

  const allPurchases = await getWoodPurchases();
  const purchases = filterWoodPurchasesList(allPurchases, {
    batchYear: batchYearFilter,
    q: q || undefined,
  });

  const yearOptions = [
    ...new Set(
      allPurchases.flatMap((p) => {
        if (p.batchYear != null && Number.isFinite(p.batchYear)) {
          return [p.batchYear];
        }
        return [new Date(p.purchaseDate).getFullYear()];
      }),
    ),
  ].sort((a, b) => b - a);

  const rows = purchases.map((purchase) => ({
    id: purchase.id,
    purchaseDate: purchase.purchaseDate.toISOString(),
    batchCode: purchase.batchCode,
    batchYear: purchase.batchYear,
    woodSpecies: purchase.woodSpecies,
    partaiLabel: formatPartaiLabel(purchase),
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
      <FormSectionCard title="Filter" className="mb-6">
        <form
          action="/purchases"
          method="get"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <div className="space-y-2">
            <Label htmlFor="q">Cari partai</Label>
            <Input
              id="q"
              name="q"
              placeholder="Kode, jenis kayu, vendor…"
              defaultValue={q}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Tahun partai</Label>
            <select id="year" name="year" className={SELECT_FIELD_CLASS} defaultValue={yearParam}>
              <option value="">Semua tahun</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="shadow-sm">
              Terapkan filter
            </Button>
            {(q || yearParam) && (
              <Button asChild type="button" variant="outline" className="bg-card">
                <Link href="/purchases">Reset</Link>
              </Button>
            )}
          </div>
        </form>
      </FormSectionCard>

      <DataListCard
        title="Riwayat Pembelian Partai"
        description={`${rows.length} partai ditampilkan. Identitas: Kode - Tahun - Jenis Kayu.`}
      >
        <PurchasesTable initialRows={rows} />
      </DataListCard>
    </AppListPage>
  );
}
