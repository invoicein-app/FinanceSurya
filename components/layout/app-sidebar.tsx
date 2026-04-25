"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/vendors", label: "Master Vendor" },
  { href: "/customers", label: "Master Customer" },
  { href: "/purchases", label: "Partai Pembelian" },
  { href: "/purchases/new", label: "Input Partai" },
  { href: "/sales", label: "Penjualan" },
  { href: "/sales/new", label: "Input Penjualan" },
  { href: "/price-list", label: "Price List" },
  { href: "/stocks", label: "Stok Sisa" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b bg-card md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0">
      <div className="flex h-full flex-col p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Navigasi Aplikasi</h2>
          <p className="text-xs text-muted-foreground">
            Sistem batch/partai penjualan kayu
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
