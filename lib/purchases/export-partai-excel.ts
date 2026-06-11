import ExcelJS from "exceljs";

import {
  formatPartaiLabel,
  resolvePartaiYear,
  resolveWoodSpecies,
} from "@/lib/partai/format-partai-label";
import {
  sumWoodPurchaseDetailVolume,
  type WoodPurchaseListRow,
} from "@/lib/services/wood-purchase-service";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF3F4F6" },
};

const RUPIAH_FMT = '"Rp"#,##0';
const QTY_FMT = "#,##0.##";
const VOLUME_FMT = "#,##0.###";
const DATE_FMT = "dd/mm/yyyy";

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, size: 11 };
  row.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
  });
}

function formatPurchaseDate(date: Date): Date {
  return new Date(date);
}

function resolveYearForExport(purchase: WoodPurchaseListRow): string | number {
  if (purchase.batchYear != null && Number.isFinite(purchase.batchYear)) {
    return purchase.batchYear;
  }
  const d = new Date(purchase.purchaseDate);
  if (!Number.isNaN(d.getTime())) {
    return d.getFullYear();
  }
  return resolvePartaiYear(purchase);
}

function formatItemDimensions(
  length: { toString(): string } | null | undefined,
  diameter: { toString(): string } | null | undefined,
): string {
  const l = length != null ? length.toString().trim() : "";
  const d = diameter != null ? diameter.toString().trim() : "";
  if (l && d) {
    return `${l} × ${d}`;
  }
  return l || d || "—";
}

function buildSummarySheet(workbook: ExcelJS.Workbook, purchases: WoodPurchaseListRow[]) {
  const sheet = workbook.addWorksheet("Ringkasan Partai", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headers = [
    "Kode Partai",
    "Tahun Partai",
    "Jenis Kayu",
    "Identitas Partai",
    "Supplier",
    "Tanggal Pembelian",
    "Total Item",
    "Total Qty",
    "Total Volume (m³)",
    "Total Nilai Pembelian",
    "Catatan",
  ];

  sheet.addRow(headers);
  styleHeaderRow(sheet.getRow(1));

  for (const purchase of purchases) {
    const totalQty = purchase.items.reduce((sum, item) => sum + Number(item.logQty ?? 0), 0);
    const totalVolume = sumWoodPurchaseDetailVolume(purchase.items);

    const row = sheet.addRow([
      purchase.batchCode,
      resolveYearForExport(purchase),
      resolveWoodSpecies(purchase.woodSpecies),
      formatPartaiLabel(purchase),
      purchase.vendor.name,
      formatPurchaseDate(purchase.purchaseDate),
      purchase.items.length,
      totalQty,
      totalVolume,
      Number(purchase.grandTotal ?? 0),
      purchase.note?.trim() || "",
    ]);

    row.getCell(6).numFmt = DATE_FMT;
    row.getCell(7).numFmt = QTY_FMT;
    row.getCell(8).numFmt = QTY_FMT;
    row.getCell(9).numFmt = VOLUME_FMT;
    row.getCell(10).numFmt = RUPIAH_FMT;
  }

  sheet.columns = [
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 28 },
    { width: 22 },
    { width: 16 },
    { width: 11 },
    { width: 12 },
    { width: 16 },
    { width: 20 },
    { width: 32 },
  ];

  return sheet;
}

function buildDetailSheet(workbook: ExcelJS.Workbook, purchases: WoodPurchaseListRow[]) {
  const sheet = workbook.addWorksheet("Detail Item Partai", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headers = [
    "Kode Partai",
    "Tahun Partai",
    "Jenis Kayu",
    "No Kapling",
    "Nama Item",
    "Panjang × Diameter",
    "Mutu / Grade",
    "Qty",
    "Volume (m³)",
    "Nilai Item",
    "Catatan Item",
  ];

  sheet.addRow(headers);
  styleHeaderRow(sheet.getRow(1));

  for (const purchase of purchases) {
    const year = resolveYearForExport(purchase);
    const species = resolveWoodSpecies(purchase.woodSpecies);

    for (const item of purchase.items) {
      const row = sheet.addRow([
        purchase.batchCode,
        year,
        species,
        item.noKapling,
        item.woodType,
        formatItemDimensions(item.length, item.diameter),
        item.mutu?.trim() || "",
        Number(item.logQty ?? 0),
        Number(item.volume ?? 0),
        Number(item.amount ?? 0),
        item.note?.trim() || "",
      ]);

      row.getCell(8).numFmt = QTY_FMT;
      row.getCell(9).numFmt = VOLUME_FMT;
      row.getCell(10).numFmt = RUPIAH_FMT;
    }
  }

  sheet.columns = [
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 16 },
    { width: 12 },
    { width: 10 },
    { width: 14 },
    { width: 16 },
    { width: 28 },
  ];

  return sheet;
}

export function buildPartaiExportFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `pembelian-partai-${y}-${m}-${d}.xlsx`;
}

export async function buildPartaiPurchasesExcelBuffer(
  purchases: WoodPurchaseListRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SuryaFinance";
  workbook.created = new Date();

  buildSummarySheet(workbook, purchases);

  const hasItems = purchases.some((p) => p.items.length > 0);
  if (hasItems) {
    buildDetailSheet(workbook, purchases);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
