import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_MUTED,
  TABLE_CELL_NUMERIC,
  TABLE_CELL_PRIMARY,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import {
  DetailEmptyState,
  DetailTableShell,
  KpiTile,
  partaiDetailCardClass,
} from "@/components/purchases/partai-detail-ui";
import { sumWoodPurchaseDetailVolume } from "@/lib/services/wood-purchase-service";
import { cn } from "@/lib/utils";

type PurchaseItemRow = {
  id: string;
  woodType: string;
  length: { toString(): string } | null;
  diameter: { toString(): string } | null;
  volume: unknown;
  mutu: string | null;
  note: string | null;
  remainingQty: unknown;
  remainingVolume: unknown;
};

type PartaiItemsSectionProps = {
  items: PurchaseItemRow[];
};

export function PartaiItemsSection({ items }: PartaiItemsSectionProps) {
  const totalVolume = sumWoodPurchaseDetailVolume(items);
  const totalRemainingVol = items.reduce(
    (sum, row) => sum + Number(row.remainingVolume ?? 0),
    0,
  );

  return (
    <Card className={partaiDetailCardClass}>
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg">Item partai</CardTitle>
        <CardDescription>
          Detail kayu mentah per baris — volume pembelian dan sisa log/kapling.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2.5 sm:grid-cols-3">
          <KpiTile label="Jumlah baris" value={items.length.toLocaleString("id-ID")} />
          <KpiTile
            label="Σ volume pembelian"
            value={totalVolume.toLocaleString("id-ID")}
            hint="m³"
            highlight
          />
          <KpiTile
            label="Σ sisa volume"
            value={totalRemainingVol.toLocaleString("id-ID")}
            hint="m³ tersisa"
          />
        </div>

        {items.length === 0 ? (
          <DetailEmptyState>Belum ada item pada partai ini.</DetailEmptyState>
        ) : (
          <DetailTableShell>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                  <TableHead className={TABLE_HEAD_CLASS}>Jenis kayu</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Panjang</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Diameter</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Volume</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>MUTU</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Catatan</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Sisa qty</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Sisa vol.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_PRIMARY}>{item.woodType}</TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>
                      {item.length?.toString() ?? "—"}
                    </TableCell>
                    <TableCell className={TABLE_CELL_MUTED}>
                      {item.diameter?.toString() ?? "—"}
                    </TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {Number(item.volume).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_DEFAULT}>
                      {item.mutu ? (
                        <span className="inline-flex rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium">
                          {item.mutu}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(TABLE_CELL_MUTED, "max-w-[160px] truncate")}
                      title={item.note ?? undefined}
                    >
                      {item.note || "—"}
                    </TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {Number(item.remainingQty).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className={TABLE_CELL_NUMERIC}>
                      {Number(item.remainingVolume).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DetailTableShell>
        )}
      </CardContent>
    </Card>
  );
}
