import Link from "next/link";
import { notFound } from "next/navigation";

import { updateSaleAction } from "@/app/sales/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleForm } from "@/components/sales/sale-form";
import { getCustomers } from "@/lib/services/customer-service";
import { getSaleById } from "@/lib/services/sale-service";
import { getThicknessStockOptionsForSaleForm } from "@/lib/services/wood-purchase-service";

type EditSalePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSalePage({ params }: EditSalePageProps) {
  const { id } = await params;
  const [sale, customers, thicknessStockOptions] = await Promise.all([
    getSaleById(id),
    getCustomers(),
    getThicknessStockOptionsForSaleForm({ adjustmentsFromSaleId: id }),
  ]);

  if (!sale) {
    notFound();
  }

  const updateAction = updateSaleAction.bind(null, sale.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Penjualan</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/sales/${sale.id}`}>Detail Penjualan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sales">Riwayat Penjualan</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Edit Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="space-y-2 text-sm">
              <p className="text-destructive">
                Master customer kosong. Tambahkan customer dulu sebelum edit transaksi.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/customers">Buka Master Customer</Link>
              </Button>
            </div>
          ) : (
            <SaleForm
              customers={customers}
              thicknessStockOptions={thicknessStockOptions}
              action={updateAction}
              submitLabel="Simpan Perubahan"
              initialValues={{
                saleDate: sale.saleDate.toISOString().slice(0, 10),
                customerId: sale.customerId ?? "",
                note: sale.note ?? "",
                items: sale.saleItems.map((item) => ({
                  id: item.id,
                  itemName: item.itemName,
                  category: item.category ?? "",
                  thickness: item.thickness ?? "",
                  width: item.width ?? "",
                  length: item.length ?? "",
                  unit: item.unit ?? "",
                  qty: item.qty.toString(),
                  price: item.price.toString(),
                  note: item.note ?? "",
                  sources: (() => {
                    const emptyPartaiRow = () => ({
                      id: crypto.randomUUID(),
                      isLegacy: false,
                      woodPurchaseId: "",
                      thicknessStockId: "",
                      purchaseItemId: "",
                      qtyTaken: "0",
                      volumeTaken: "0",
                      costAmount: "0",
                    });

                    if (item.sources.length === 0) {
                      return [emptyPartaiRow()];
                    }

                    const mapped = item.sources.map((source) => {
                      const legacy =
                        Boolean(source.purchaseItemId) && !source.thicknessStockId;
                      return {
                        id: source.id,
                        isLegacy: legacy,
                        woodPurchaseId:
                          !legacy && source.thicknessStock
                            ? source.thicknessStock.purchaseId
                            : "",
                        thicknessStockId: source.thicknessStockId ?? "",
                        purchaseItemId: source.purchaseItemId ?? "",
                        legacyLabel: source.purchaseItem
                          ? `${source.purchaseItem.purchase.batchCode} / Kapling ${source.purchaseItem.noKapling}`
                          : undefined,
                        qtyTaken: source.qtyTaken.toString(),
                        volumeTaken: source.volumeTaken.toString(),
                        costAmount: source.costAmount.toString(),
                      };
                    });

                    return mapped;
                  })(),
                })),
              }}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
