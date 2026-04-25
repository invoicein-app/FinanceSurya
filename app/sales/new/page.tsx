import Link from "next/link";

import { createSaleAction } from "@/app/sales/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleForm } from "@/components/sales/sale-form";
import { getCustomers } from "@/lib/services/customer-service";
import { getThicknessStockOptionsForSaleForm } from "@/lib/services/wood-purchase-service";

export default async function NewSalePage() {
  const [customers, thicknessStockOptions] = await Promise.all([
    getCustomers(),
    getThicknessStockOptionsForSaleForm(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transaksi Penjualan Baru</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/sales">Riwayat Penjualan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Dashboard</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="space-y-2 text-sm">
              <p className="text-destructive">
                Belum ada master customer. Tambahkan customer terlebih dulu.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/customers">Buka Master Customer</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {thicknessStockOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada baris stok per ketebalan di partai — penjualan tetap bisa disimpan (alokasi
                  sumber opsional). Tambahkan stok nanti di{" "}
                  <Link className="underline" href="/purchases">
                    detail partai
                  </Link>
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
        </CardContent>
      </Card>
    </main>
  );
}
