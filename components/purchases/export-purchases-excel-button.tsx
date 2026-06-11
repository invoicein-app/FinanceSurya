"use client";

import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type ExportPurchasesExcelButtonProps = {
  /** Filter tahun partai aktif (kosong = semua). */
  year?: string;
  /** Filter pencarian aktif. */
  q?: string;
};

function parseFilenameFromDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? null;
}

export function ExportPurchasesExcelButton({ year, q }: ExportPurchasesExcelButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const exportingRef = useRef(false);

  const handleExport = async () => {
    if (exportingRef.current) {
      return;
    }

    exportingRef.current = true;
    setExporting(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      if (q?.trim()) {
        params.set("q", q.trim());
      }
      if (year?.trim()) {
        params.set("year", year.trim());
      }

      const query = params.toString();
      const url = query ? `/api/purchases/export?${query}` : "/api/purchases/export";

      const response = await fetch(url);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Gagal mengekspor data pembelian partai.");
      }

      const blob = await response.blob();
      const filename =
        parseFilenameFromDisposition(response.headers.get("Content-Disposition")) ??
        "pembelian-partai.xlsx";

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengekspor data pembelian partai.",
      );
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        className="gap-1.5 bg-card shadow-sm"
        disabled={exporting}
        onClick={() => void handleExport()}
      >
        {exporting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <FileSpreadsheet className="size-4" aria-hidden />
        )}
        {exporting ? "Mengekspor…" : "Export to Excel"}
      </Button>
      {errorMessage ? (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
