import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCustomerPriceListForPage } from "@/lib/services/customer-price-list-service";
import { getCustomers } from "@/lib/services/customer-service";

type PriceListPageProps = {
  searchParams: Promise<{ customerId?: string; q?: string }>;
};

export default async function PriceListPage({ searchParams }: PriceListPageProps) {
  const params = await searchParams;
  const customers = await getCustomers();
  const customerId = params.customerId ?? "";
  const q = params.q?.trim() ?? "";

  const rows = customerId
    ? await getCustomerPriceListForPage({
        customerId,
        search: q || undefined,
      })
    : [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Price List per Customer</h1>
          <p className="text-sm text-muted-foreground">
            Daftar harga terakhir otomatis dari histori penjualan (bukan input manual dari nol).
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/sales/new">Input Penjualan</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/price-list" method="get" className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                name="customerId"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue={customerId}
              >
                <option value="">-- Pilih customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="q">Cari nama item</Label>
              <Input id="q" name="q" placeholder="Contoh: kayu" defaultValue={q} />
            </div>
            <Button type="submit">Tampilkan</Button>
          </form>
          {customers.length === 0 ? (
            <p className="mt-4 text-sm text-destructive">
              Belum ada master customer. Tambahkan di menu Master Customer.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {!customerId ? (
        <p className="text-sm text-muted-foreground">
          Pilih customer lalu klik Tampilkan untuk melihat price list.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada data price list untuk customer ini. Price list terisi otomatis setelah ada
          transaksi penjualan.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Item & harga terakhir</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3 font-medium">Nama item</th>
                  <th className="py-2 pr-3 font-medium">Mutu</th>
                  <th className="py-2 pr-3 font-medium">Tebal</th>
                  <th className="py-2 pr-3 font-medium">Lebar</th>
                  <th className="py-2 pr-3 font-medium">Panjang</th>
                  <th className="py-2 pr-3 font-medium">Satuan</th>
                  <th className="py-2 pr-3 font-medium">Harga terakhir</th>
                  <th className="py-2 font-medium">Transaksi terakhir</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-muted/60">
                    <td className="py-2 pr-3 align-top">{row.itemName}</td>
                    <td className="py-2 pr-3 align-top text-muted-foreground">
                      {row.category ?? "—"}
                    </td>
                    <td className="py-2 pr-3 align-top text-muted-foreground">
                      {row.thickness ?? "—"}
                    </td>
                    <td className="py-2 pr-3 align-top text-muted-foreground">
                      {row.width ?? "—"}
                    </td>
                    <td className="py-2 pr-3 align-top text-muted-foreground">
                      {row.length ?? "—"}
                    </td>
                    <td className="py-2 pr-3 align-top text-muted-foreground">
                      {row.unit ?? "—"}
                    </td>
                    <td className="py-2 pr-3 align-top font-medium">
                      Rp {Number(row.latestPrice).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 align-top">
                      {row.lastSaleDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
