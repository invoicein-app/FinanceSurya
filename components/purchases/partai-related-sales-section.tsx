"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  previewPartaiTransferDestinationAction,
  transferSaleAllocationAction,
} from "@/app/purchases/actions";
import {
  AnalysisSection,
  DetailContentPanel,
  DetailEmptyState,
  DetailTableShell,
  KpiTile,
  partaiDetailCardClass,
} from "@/components/purchases/partai-detail-ui";
import {
  TABLE_BODY_ROW_CLASS,
  TABLE_HEAD_CLASS,
  TABLE_MOBILE_CARD_CLASS,
  TABLE_CELL_ACTIONS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DATE,
  TABLE_CELL_DEFAULT,
  TABLE_CELL_NUMERIC,
  TABLE_CELL_MUTED,
  TABLE_CELL_VENDOR,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  PartaiRelatedSaleUsageRow,
  PartaiRelatedSaleUsagesResult,
  PartaiTransferDestinationPreview,
  PartaiTransferOption,
} from "@/lib/services/wood-purchase-service";

type PartaiRelatedSalesSectionProps = {
  currentPurchaseId: string;
  currentBatchCode: string;
  data: PartaiRelatedSaleUsagesResult;
  transferOptions: PartaiTransferOption[];
};

type TransferTarget = PartaiRelatedSaleUsageRow;

function thicknessDisplay(label: string): string {
  return label === "—" ? "—" : `${label} mm`;
}

export function PartaiRelatedSalesSection({
  currentPurchaseId,
  currentBatchCode,
  data,
  transferOptions,
}: PartaiRelatedSalesSectionProps) {
  const router = useRouter();
  const { rows, summary } = data;
  const thicknessSummary = Object.entries(summary.qtyByThickness).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  const [transferTarget, setTransferTarget] = useState<TransferTarget | null>(null);
  const [destinationId, setDestinationId] = useState("");
  const [destPreview, setDestPreview] = useState<PartaiTransferDestinationPreview | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeTransfer = useCallback(
    (force = false) => {
      if (transferring && !force) {
        return;
      }
      setTransferTarget(null);
      setDestinationId("");
      setDestPreview(null);
      setErrorMessage(null);
    },
    [transferring],
  );

  const openTransfer = (row: TransferTarget) => {
    if (!row.canTransfer || transferring) {
      return;
    }
    setErrorMessage(null);
    setDestinationId("");
    setDestPreview(null);
    setTransferTarget(row);
  };

  useEffect(() => {
    if (!transferTarget || !destinationId) {
      setDestPreview(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setErrorMessage(null);

    void previewPartaiTransferDestinationAction(
      destinationId,
      transferTarget.thicknessLabel,
    )
      .then((preview) => {
        if (!cancelled) {
          setDestPreview(preview);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setDestPreview(null);
          setErrorMessage(
            error instanceof Error ? error.message : "Gagal memuat stok partai tujuan.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [transferTarget, destinationId]);

  const selectedOption = transferOptions.find((o) => o.id === destinationId);

  const handleConfirmTransfer = async () => {
    if (!transferTarget || !destinationId || transferring) {
      return;
    }
    setTransferring(true);
    setErrorMessage(null);
    try {
      await transferSaleAllocationAction(
        transferTarget.sourceId,
        currentPurchaseId,
        destinationId,
      );
      closeTransfer(true);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal memindahkan alokasi.",
      );
    } finally {
      setTransferring(false);
    }
  };

  const renderActions = (row: PartaiRelatedSaleUsageRow, stacked?: boolean) => (
    <div className={stacked ? "mt-3 flex flex-col gap-2" : "flex justify-end gap-2"}>
      {row.canTransfer ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={Boolean(transferring)}
          onClick={() => openTransfer(row)}
        >
          Pindahkan
        </Button>
      ) : null}
      <Button asChild variant="outline" size="sm" className={stacked ? "w-full" : undefined}>
        <Link href={`/sales/${row.saleId}`}>{stacked ? "Lihat penjualan" : "Detail"}</Link>
      </Button>
    </div>
  );

  return (
    <>
      <Card className={partaiDetailCardClass}>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg">Penjualan terkait</CardTitle>
          <CardDescription>
            Alokasi yang mengambil stok partai ini. Gunakan <strong>Pindahkan</strong> bila salah
            partai.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label="Transaksi unik"
              value={summary.uniqueSaleCount.toLocaleString("id-ID")}
            />
            <KpiTile
              label="Baris alokasi"
              value={summary.allocationCount.toLocaleString("id-ID")}
            />
            <KpiTile
              label="Total qty terpakai"
              value={summary.totalQtyTaken.toLocaleString("id-ID")}
              highlight
            />
            {summary.totalVolumeTaken > 0 ? (
              <KpiTile
                label="Volume (data lama)"
                value={summary.totalVolumeTaken.toLocaleString("id-ID")}
              />
            ) : null}
          </div>

          {thicknessSummary.length > 0 ? (
            <AnalysisSection
              title="Pemakaian per ketebalan"
              description="Agregat qty alokasi penjualan untuk partai ini."
            >
              <div className="flex flex-wrap gap-2">
                {thicknessSummary.map(([mm, qty]) => (
                  <span
                    key={mm}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-sm shadow-sm"
                  >
                    <span className="font-semibold tabular-nums">{mm} mm</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-bold tabular-nums">{qty.toLocaleString("id-ID")}</span>
                  </span>
                ))}
              </div>
            </AnalysisSection>
          ) : null}

          {rows.length === 0 ? (
            <DetailEmptyState>
              Belum ada penjualan yang mengalokasikan stok dari partai ini.
            </DetailEmptyState>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {rows.map((row) => (
                  <article
                    key={row.sourceId}
                    className={TABLE_MOBILE_CARD_CLASS}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2">
                      <p className="font-semibold">
                        {new Date(row.saleDate).toLocaleDateString("id-ID")}
                      </p>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                        {row.qtyTaken.toLocaleString("id-ID")} qty
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                      <div className="col-span-2">
                        <dt className="text-xs text-muted-foreground">Customer</dt>
                        <dd>{row.customerLabel}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs text-muted-foreground">Item</dt>
                        <dd>
                          {row.itemName}
                          {row.sourceKind === "legacy_log" ? (
                            <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">
                              Data lama: alokasi log/kapling (pindah lewat edit penjualan)
                            </span>
                          ) : null}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Tebal</dt>
                        <dd>{thicknessDisplay(row.thicknessLabel)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Qty dipakai</dt>
                        <dd className="tabular-nums">{row.qtyTaken.toLocaleString("id-ID")}</dd>
                      </div>
                      {row.unit ? (
                        <div>
                          <dt className="text-xs text-muted-foreground">Satuan</dt>
                          <dd>{row.unit}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-xs text-muted-foreground">Harga item</dt>
                        <dd>Rp {row.price.toLocaleString("id-ID")}</dd>
                      </div>
                    </dl>
                    {renderActions(row, true)}
                  </article>
                ))}
              </div>

              <DetailContentPanel className="hidden p-0 md:block">
                <DetailTableShell>
                  <Table>
                    <TableHeader>
                      <TableRow className={TABLE_HEADER_ROW_CLASS}>
                        <TableHead className={TABLE_HEAD_CLASS}>Tanggal</TableHead>
                        <TableHead className={TABLE_HEAD_CLASS}>Customer</TableHead>
                        <TableHead className={TABLE_HEAD_CLASS}>Item</TableHead>
                        <TableHead className={TABLE_HEAD_CLASS}>Tebal</TableHead>
                        <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>
                          Qty dipakai
                        </TableHead>
                        <TableHead className={TABLE_HEAD_CLASS}>Satuan</TableHead>
                        <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>
                          Harga
                        </TableHead>
                        <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.sourceId} className={TABLE_BODY_ROW_CLASS}>
                          <TableCell className={TABLE_CELL_DATE}>
                            {new Date(row.saleDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className={TABLE_CELL_VENDOR}>{row.customerLabel}</TableCell>
                          <TableCell className={cn(TABLE_CELL_DEFAULT, "max-w-[220px]")} title={row.itemName}>
                            <span className="block truncate font-semibold text-foreground">
                              {row.itemName}
                            </span>
                            {row.sourceKind === "legacy_log" ? (
                              <span className="text-xs text-amber-700 dark:text-amber-400">
                                Data lama: log/kapling
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className={TABLE_CELL_NUMERIC}>
                            {thicknessDisplay(row.thicknessLabel)}
                          </TableCell>
                          <TableCell className={TABLE_CELL_NUMERIC}>
                            {row.qtyTaken.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className={TABLE_CELL_MUTED}>{row.unit ?? "—"}</TableCell>
                          <TableCell className={TABLE_CELL_AMOUNT}>
                            Rp {row.price.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className={TABLE_CELL_ACTIONS}>{renderActions(row)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DetailTableShell>
              </DetailContentPanel>
            </>
          )}
        </CardContent>
      </Card>

      {transferTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={closeTransfer}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-allocation-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border/70 bg-background p-6 shadow-xl ring-1 ring-foreground/10"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="transfer-allocation-title" className="text-lg font-semibold">
              Pindahkan ke partai lain
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hanya alokasi partai yang berubah. Harga, customer, dan tanggal penjualan tetap.
            </p>

            <dl className="mt-4 space-y-2 rounded-xl border border-border/60 bg-gradient-to-b from-muted/40 to-muted/15 p-4 text-sm shadow-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tanggal penjualan</dt>
                <dd className="text-right font-medium">
                  {new Date(transferTarget.saleDate).toLocaleDateString("id-ID")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="text-right font-medium">{transferTarget.customerLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Item</dt>
                <dd className="max-w-[60%] text-right font-medium">{transferTarget.itemName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tebal</dt>
                <dd className="text-right font-medium tabular-nums">
                  {thicknessDisplay(transferTarget.thicknessLabel)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Qty</dt>
                <dd className="text-right font-medium tabular-nums">
                  {transferTarget.qtyTaken.toLocaleString("id-ID")}
                  {transferTarget.unit ? ` ${transferTarget.unit}` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-2">
                <dt className="text-muted-foreground">Partai saat ini</dt>
                <dd className="text-right font-medium">{currentBatchCode}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2">
              <Label htmlFor="transfer-destination">Partai tujuan</Label>
              <select
                id="transfer-destination"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                value={destinationId}
                disabled={transferring}
                onChange={(e) => setDestinationId(e.target.value)}
              >
                <option value="">— Pilih partai —</option>
                {transferOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.batchCode} — {opt.vendorName}
                  </option>
                ))}
              </select>
            </div>

            {destinationId && selectedOption ? (
              <div className="mt-3 rounded-xl border border-border/60 bg-muted/25 px-3 py-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Partai tujuan:</span>{" "}
                  <strong>{selectedOption.batchCode}</strong> ({selectedOption.vendorName})
                </p>
                {previewLoading ? (
                  <p className="mt-2 text-muted-foreground">Memuat stok tujuan…</p>
                ) : destPreview ? (
                  <p className="mt-2 tabular-nums">
                    Stok {destPreview.thicknessMm} mm di tujuan:{" "}
                    <strong>
                      {destPreview.qtyAvailable.toLocaleString("id-ID")}
                      {destPreview.unit ? ` ${destPreview.unit}` : ""}
                    </strong>
                    {!destPreview.hasStockRow ? (
                      <span className="block text-destructive">
                        Belum ada baris stok untuk tebal ini.
                      </span>
                    ) : destPreview.qtyAvailable < transferTarget.qtyTaken ? (
                      <span className="block text-destructive">
                        Stok tidak cukup untuk pemindahan ini.
                      </span>
                    ) : (
                      <span className="block text-muted-foreground">
                        Setelah pindah: stok tujuan −{transferTarget.qtyTaken.toLocaleString("id-ID")},{" "}
                        partai ini +{transferTarget.qtyTaken.toLocaleString("id-ID")}.
                      </span>
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}

            {errorMessage ? (
              <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={transferring}
                onClick={closeTransfer}
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={
                  transferring ||
                  !destinationId ||
                  previewLoading ||
                  !destPreview?.hasStockRow ||
                  (destPreview?.qtyAvailable ?? 0) < transferTarget.qtyTaken
                }
                onClick={() => void handleConfirmTransfer()}
              >
                {transferring ? "Memindahkan…" : "Konfirmasi pindah"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
