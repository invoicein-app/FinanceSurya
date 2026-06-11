import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  buildPartaiExportFilename,
  buildPartaiPurchasesExcelBuffer,
} from "@/lib/purchases/export-partai-excel";
import {
  filterWoodPurchasesList,
  getWoodPurchases,
} from "@/lib/services/wood-purchase-service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const yearParam = searchParams.get("year")?.trim() ?? "";
  const batchYear = yearParam ? Number(yearParam) : undefined;
  const batchYearFilter =
    batchYear != null && Number.isFinite(batchYear) ? batchYear : undefined;

  try {
    const allPurchases = await getWoodPurchases();
    const purchases = filterWoodPurchasesList(allPurchases, {
      batchYear: batchYearFilter,
      q: q || undefined,
    });

    const buffer = await buildPartaiPurchasesExcelBuffer(purchases);
    const filename = buildPartaiExportFilename();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[purchases/export]", error);
    return NextResponse.json({ error: "Gagal membuat file Excel." }, { status: 500 });
  }
}
