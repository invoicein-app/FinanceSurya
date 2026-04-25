import Link from "next/link";

import { createPurchaseAction } from "@/app/purchases/actions";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVendors } from "@/lib/services/vendor-service";

export default async function NewPurchasePage() {
  const vendors = await getVendors();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tambah Partai Pembelian</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/purchases">Daftar Partai</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vendors">Master Vendor</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Partai Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <div className="space-y-2 text-sm">
              <p className="text-destructive">
                Belum ada vendor. Tambahkan vendor dulu sebelum input pembelian.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/vendors">Buka Master Vendor</Link>
              </Button>
            </div>
          ) : (
            <PurchaseForm
              vendors={vendors}
              action={createPurchaseAction}
              submitLabel="Simpan Partai"
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
