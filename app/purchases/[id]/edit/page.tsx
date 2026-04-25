import Link from "next/link";
import { notFound } from "next/navigation";

import { updatePurchaseAction } from "@/app/purchases/actions";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVendors } from "@/lib/services/vendor-service";
import { getWoodPurchaseById } from "@/lib/services/wood-purchase-service";

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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Partai Pembelian</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/purchases/${purchase.id}`}>Detail Partai</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/purchases">Daftar Partai</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Edit Partai</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm
            vendors={vendors}
            action={updateAction}
            submitLabel="Simpan Perubahan"
            initialValues={{
              vendorId: purchase.vendorId,
              purchaseDate: purchase.purchaseDate.toISOString().slice(0, 10),
              batchCode: purchase.batchCode,
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
        </CardContent>
      </Card>
    </main>
  );
}
