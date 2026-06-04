import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AnalysisSection,
  DistributionBar,
  GradeMiniCard,
  KpiTile,
  partaiDetailCardClass,
} from "@/components/purchases/partai-detail-ui";
import type {
  PartaiPurchaseAnalytics,
  PartaiVeneerOutputAnalytics,
} from "@/lib/services/wood-purchase-service";

type PartaiAnalysisSummaryProps = {
  purchaseAnalytics: PartaiPurchaseAnalytics;
  veneerAnalytics: PartaiVeneerOutputAnalytics;
};

function formatPercent(value: number): string {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 text-sm last:border-0 last:pb-0 first:pt-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function PartaiAnalysisSummary({
  purchaseAnalytics,
  veneerAnalytics,
}: PartaiAnalysisSummaryProps) {
  const gradeABC = ["A", "B", "C"].map((g) =>
    veneerAnalytics.gradeRows.find((row) => row.grade === g),
  );
  const maxLengthShare = Math.max(
    ...veneerAnalytics.lengthRows.map((r) => r.sharePercent),
    0,
  );

  return (
    <Card className={`${partaiDetailCardClass} h-full`}>
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg">Ringkasan analisis</CardTitle>
        <CardDescription>
          Pembelian mentah dan hasil veneer dari penjualan yang terhubung ke partai ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnalysisSection
          title="Pembelian partai"
          description="Agregat dari baris item pembelian (kayu mentah)."
        >
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <KpiTile
              label="Jumlah item"
              value={purchaseAnalytics.itemCount.toLocaleString("id-ID")}
            />
            <KpiTile
              label="Jumlah batang"
              value={purchaseAnalytics.totalLogQty.toLocaleString("id-ID")}
              hint="Σ log qty"
            />
          </div>
          <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-1">
            <MetricRow
              label="Total volume"
              value={`${purchaseAnalytics.totalVolume.toLocaleString("id-ID")} m³`}
            />
            <MetricRow
              label="Grand total"
              value={`Rp ${purchaseAnalytics.grandTotal.toLocaleString("id-ID")}`}
            />
            <MetricRow
              label="Rata-rata harga / m³"
              value={
                purchaseAnalytics.avgPricePerM3 != null
                  ? `Rp ${Math.round(purchaseAnalytics.avgPricePerM3).toLocaleString("id-ID")}`
                  : "—"
              }
            />
          </div>
        </AnalysisSection>

        <AnalysisSection
          title="Hasil veneer dari partai"
          description="Dari alokasi penjualan: grade = Mutu item, qty = qty alokasi."
        >
          {veneerAnalytics.totalOutputQty <= 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-background/50 px-3 py-4 text-center text-sm text-muted-foreground">
              Belum ada output veneer teralokasi dari penjualan untuk partai ini.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <KpiTile
                  label="Total output"
                  value={veneerAnalytics.totalOutputQty.toLocaleString("id-ID")}
                  hint="Σ qty alokasi"
                  highlight
                />
                <KpiTile
                  label="Baris alokasi"
                  value={veneerAnalytics.allocationCount.toLocaleString("id-ID")}
                  hint="Transaksi terhubung"
                />
              </div>

              <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Grade A · B · C
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {gradeABC.map((row, index) => {
                    const label = ["A", "B", "C"][index];
                    return (
                      <GradeMiniCard
                        key={label}
                        grade={label}
                        qty={row?.qty ?? 0}
                        sharePercent={row?.sharePercent ?? 0}
                      />
                    );
                  })}
                </div>
                {veneerAnalytics.gradeRows.some((row) => !["A", "B", "C"].includes(row.grade)) ? (
                  <ul className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                    {veneerAnalytics.gradeRows
                      .filter((row) => !["A", "B", "C"].includes(row.grade))
                      .map((row) => (
                        <li
                          key={row.grade}
                          className="flex justify-between gap-2 text-sm"
                        >
                          <span className="font-medium">{row.grade}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {row.qty.toLocaleString("id-ID")} ({formatPercent(row.sharePercent)})
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            </div>
          )}
        </AnalysisSection>

        {veneerAnalytics.lengthRows.length > 0 ? (
          <AnalysisSection
            title="Distribusi panjang"
            description="Kategori teks dari kolom panjang item penjualan."
          >
            <div className="max-h-52 space-y-2.5 overflow-y-auto pr-0.5">
              {veneerAnalytics.lengthRows.map((row) => (
                <DistributionBar
                  key={row.label}
                  label={row.label}
                  valueLabel={`${row.qty.toLocaleString("id-ID")} · ${formatPercent(row.sharePercent)}`}
                  percent={maxLengthShare > 0 ? (row.sharePercent / maxLengthShare) * 100 : 0}
                />
              ))}
            </div>
          </AnalysisSection>
        ) : null}
      </CardContent>
    </Card>
  );
}
