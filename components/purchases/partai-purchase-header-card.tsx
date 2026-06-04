import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InfoField,
  KpiTile,
  partaiDetailCardClass,
} from "@/components/purchases/partai-detail-ui";
import type { PartaiPurchaseAnalytics } from "@/lib/services/wood-purchase-service";

type PartaiPurchaseHeaderCardProps = {
  purchase: {
    purchaseDate: Date;
    batchCode: string;
    documentNumber: string | null;
    note: string | null;
    bpCost: unknown;
    cuttingCost: unknown;
    shippingCost: unknown;
    woodPrice: unknown;
    grandTotal: unknown;
    vendor: { name: string };
  };
  purchaseAnalytics: PartaiPurchaseAnalytics;
};

export function PartaiPurchaseHeaderCard({
  purchase,
  purchaseAnalytics,
}: PartaiPurchaseHeaderCardProps) {
  const costRows = [
    { label: "BP Cost", value: Number(purchase.bpCost) },
    { label: "Cutting Cost", value: Number(purchase.cuttingCost) },
    { label: "Shipping Cost", value: Number(purchase.shippingCost) },
    { label: "Harga Kayu", value: Number(purchase.woodPrice ?? 0) },
  ];

  return (
    <Card className={partaiDetailCardClass}>
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg">Header pembelian</CardTitle>
        <CardDescription>
          {purchase.batchCode} · {purchase.vendor.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-2.5 sm:grid-cols-2">
          <InfoField
            label="Tanggal"
            value={new Date(purchase.purchaseDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <InfoField label="Batch / truk" value={purchase.batchCode} />
          <InfoField label="Nomor dokumen" value={purchase.documentNumber || "—"} />
          <InfoField label="Catatan" value={purchase.note || "—"} />
        </dl>

        <div className="grid gap-2 sm:grid-cols-2">
          {costRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/25 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular-nums">
                Rp {row.value.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 to-primary/3 px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Grand total
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
            Rp {Number(purchase.grandTotal).toLocaleString("id-ID")}
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <KpiTile
            label="Total volume"
            value={purchaseAnalytics.totalVolume.toLocaleString("id-ID")}
            hint="Σ volume baris item"
          />
          <KpiTile
            label="Rata-rata / m³"
            value={
              purchaseAnalytics.avgPricePerM3 != null
                ? `Rp ${Math.round(purchaseAnalytics.avgPricePerM3).toLocaleString("id-ID")}`
                : "—"
            }
            hint="Grand total ÷ volume"
          />
        </div>
      </CardContent>
    </Card>
  );
}
