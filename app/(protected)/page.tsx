import Link from "next/link";
import { LayoutDashboard, Package, PlusCircle, ShoppingCart, Users } from "lucide-react";

import { AppListPage } from "@/components/layout/app-list-page";
import { DataListCard } from "@/components/layout/data-list-card";
import {
  DashboardTableArea,
  DataTableLink,
  FORM_CARD_CLASS,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_DATE,
  TABLE_CELL_PRIMARY,
  TABLE_CELL_VENDOR,
  TABLE_EMPTY_CELL,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/app-theme-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatPartaiLabel } from "@/lib/partai/format-partai-label";
import { cn } from "@/lib/utils";

export default async function Home() {
  const dbResult = await (async () => {
    try {
      const purchases = await prisma.woodPurchase.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { vendor: true },
      });

      return {
        status: "connected" as const,
        message: "",
        purchases,
      };
    } catch (error: unknown) {
      return {
        status: "error" as const,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi error tidak dikenal saat koneksi database.",
        purchases: [],
      };
    }
  })();

  const quickLinks = [
    { href: "/vendors", label: "Master Vendor", icon: Package },
    { href: "/customers", label: "Master Customer", icon: Users },
    { href: "/purchases", label: "Daftar Partai", icon: Package },
    { href: "/purchases/new", label: "Input Partai", icon: PlusCircle },
    { href: "/sales", label: "Daftar Penjualan", icon: ShoppingCart },
    { href: "/sales/new", label: "Input Penjualan", icon: PlusCircle },
    { href: "/stocks", label: "Stok Sisa", icon: LayoutDashboard },
  ];

  return (
    <AppListPage
      title="Dashboard"
      description="Sistem batch/partai penjualan kayu"
      icon={LayoutDashboard}
    >
      <Card className={cn(FORM_CARD_CLASS, "mb-6")}>
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-[var(--table-border)] bg-gradient-to-b from-[var(--table-card-header)] to-card px-5 py-5 sm:px-6">
          <CardTitle className="font-heading text-base font-semibold">Ringkasan</CardTitle>
          <Badge variant={dbResult.status === "connected" ? "default" : "destructive"}>
            {dbResult.status === "connected" ? "DB Connected" : "DB Error"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pt-6 pb-6 sm:px-6">
          <p className="text-sm text-muted-foreground">
            Aplikasi ini memakai arsitektur stok berbasis partai pembelian kayu.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  asChild
                  variant="outline"
                  className="h-auto justify-start gap-2 bg-card py-3 shadow-sm"
                >
                  <Link href={link.href}>
                    <Icon className="size-4 shrink-0 text-primary" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </div>
          {dbResult.status === "error" ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Gagal konek ke database: {dbResult.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <DataListCard
        title="Partai Pembelian Terbaru"
        description="Ringkasan batch pembelian terakhir yang tercatat di sistem."
        badge="Maks 5"
      >
        <DashboardTableArea>
          <Table>
            <TableHeader>
              <TableRow className={TABLE_HEADER_ROW_CLASS}>
                <TableHead className={TABLE_HEAD_CLASS}>Tanggal</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Partai</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>Vendor</TableHead>
                <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>Grand Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbResult.purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className={TABLE_EMPTY_CELL}>
                    Belum ada data partai pembelian.
                  </TableCell>
                </TableRow>
              ) : (
                dbResult.purchases.map((purchase) => (
                  <TableRow key={purchase.id} className={TABLE_BODY_ROW_CLASS}>
                    <TableCell className={TABLE_CELL_DATE}>
                      {new Date(purchase.purchaseDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className={TABLE_CELL_PRIMARY}>
                      <DataTableLink href={`/purchases/${purchase.id}`}>
                        {formatPartaiLabel(purchase)}
                      </DataTableLink>
                    </TableCell>
                    <TableCell className={TABLE_CELL_VENDOR}>{purchase.vendor.name}</TableCell>
                    <TableCell className={TABLE_CELL_AMOUNT}>
                      Rp {Number(purchase.grandTotal).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DashboardTableArea>
      </DataListCard>
    </AppListPage>
  );
}
