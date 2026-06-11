"use client";

import { addThicknessStockAction, deleteThicknessStockAction } from "@/app/purchases/actions";
import { MutationActionForm } from "@/components/mutation-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThicknessMmInput } from "@/components/thickness-mm-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DetailContentPanel,
  DetailEmptyState,
  DetailHintBox,
  DetailTableShell,
  KpiTile,
  partaiDetailCardClass,
} from "@/components/purchases/partai-detail-ui";
import {
  TABLE_BODY_ROW_CLASS,
  TABLE_HEAD_CLASS,
  TABLE_CELL_ACTIONS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_MUTED,
  TABLE_CELL_PRIMARY,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { cn } from "@/lib/utils";

type ThicknessStockRow = {
  id: string;
  thicknessMm: { toString(): string };
  qtyAvailable: unknown;
  unit: string | null;
};

type PartaiThicknessStockSectionProps = {
  purchaseId: string;
  thicknessStocks: ThicknessStockRow[];
};

export function PartaiThicknessStockSection({
  purchaseId,
  thicknessStocks,
}: PartaiThicknessStockSectionProps) {
  const negativeCount = thicknessStocks.filter((row) => Number(row.qtyAvailable) < 0).length;

  return (
    <Card className={partaiDetailCardClass}>
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg">Stok veneer per ketebalan</CardTitle>
        <CardDescription>
          Stok yang dipakai saat penjualan. Default 0.6 & 1.2 mm; tambah ketebalan lain bila perlu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {thicknessStocks.length > 0 ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {thicknessStocks.map((row) => {
              const qty = Number(row.qtyAvailable);
              const isNegative = qty < 0;
              return (
                <KpiTile
                  key={row.id}
                  label={`${row.thicknessMm.toString()} mm`}
                  value={qty.toLocaleString("id-ID")}
                  hint={row.unit ?? "—"}
                  highlight={isNegative}
                  className={cn(isNegative && "border-destructive/30 bg-destructive/5")}
                />
              );
            })}
          </div>
        ) : null}

        {negativeCount > 0 ? (
          <DetailHintBox>
            <strong>{negativeCount}</strong> baris stok minus — cek{" "}
            <strong>Penjualan terkait</strong> di bawah untuk menelusuri alokasi.
          </DetailHintBox>
        ) : null}

        <DetailContentPanel>
          <p className="mb-3 text-sm font-medium">Tambah baris stok</p>
          <MutationActionForm action={addThicknessStockAction} className="space-y-2">
            <input type="hidden" name="purchaseId" value={purchaseId} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="thicknessMm">Ketebalan (mm)</Label>
                <ThicknessMmInput id="thicknessMm" name="thicknessMm" required placeholder="0.6" />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="qtyInitial">Qty awal</Label>
                <Input
                  id="qtyInitial"
                  name="qtyInitial"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  placeholder="100"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="unit">Satuan</Label>
                <Input id="unit" name="unit" placeholder="m2" defaultValue="m2" />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label className="hidden lg:block lg:invisible" aria-hidden="true">
                  Aksi
                </Label>
                <Button type="submit" className="w-full lg:w-auto">
                  Tambah baris stok
                </Button>
              </div>
            </div>
            <DetailHintBox>
              Desimal pakai <strong>titik</strong> (mis. 0.6), bukan koma.
            </DetailHintBox>
          </MutationActionForm>
        </DetailContentPanel>

        {thicknessStocks.length === 0 ? (
          <DetailEmptyState>Belum ada baris stok per ketebalan.</DetailEmptyState>
        ) : (
          <DetailTableShell>
            <Table>
              <TableHeader>
                <TableRow className={TABLE_HEADER_ROW_CLASS}>
                  <TableHead className={TABLE_HEAD_CLASS}>Ketebalan (mm)</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Sisa qty</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>Satuan</TableHead>
                  <TableHead className={cn(TABLE_HEAD_CLASS, "w-[120px] text-right")}>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thicknessStocks.map((row) => {
                  const qty = Number(row.qtyAvailable);
                  const isNegative = qty < 0;
                  return (
                    <TableRow key={row.id} className={TABLE_BODY_ROW_CLASS}>
                      <TableCell className={TABLE_CELL_PRIMARY}>
                        {row.thicknessMm.toString()}
                      </TableCell>
                      <TableCell
                        className={cn(
                          TABLE_CELL_AMOUNT,
                          "text-[0.875rem]",
                          isNegative && "text-destructive",
                        )}
                      >
                        {qty.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className={TABLE_CELL_MUTED}>{row.unit ?? "—"}</TableCell>
                      <TableCell className={TABLE_CELL_ACTIONS}>
                        <MutationActionForm
                          action={deleteThicknessStockAction}
                          mutationKind="delete"
                        >
                          <input type="hidden" name="purchaseId" value={purchaseId} />
                          <input type="hidden" name="stockId" value={row.id} />
                          <Button type="submit" variant="outline" size="sm">
                            Hapus
                          </Button>
                        </MutationActionForm>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DetailTableShell>
        )}
      </CardContent>
    </Card>
  );
}
