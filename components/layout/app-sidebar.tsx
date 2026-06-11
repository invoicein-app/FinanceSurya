"use client";

import { usePathname } from "next/navigation";

import { AppNavLink } from "@/components/app-nav-link";
import {
  FileStack,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  ShoppingCart,
  Tag,
  TreePine,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { signOutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Master Vendor", icon: Truck },
  { href: "/customers", label: "Master Customer", icon: Users },
  {
    href: "/purchases",
    label: "Partai Pembelian",
    icon: Package,
    match: (p) => p === "/purchases" || (p.startsWith("/purchases/") && p !== "/purchases/new"),
  },
  { href: "/purchases/new", label: "Input Partai", icon: PlusCircle },
  {
    href: "/sales",
    label: "Penjualan",
    icon: ShoppingCart,
    match: (p) =>
      p === "/sales" ||
      (p.startsWith("/sales/") && !p.startsWith("/sales/new")),
  },
  { href: "/sales/new", label: "Input Penjualan", icon: PlusCircle },
  {
    href: "/invoices",
    label: "Invoice Group",
    icon: FileStack,
    match: (p) => p === "/invoices" || p.startsWith("/invoices/"),
  },
  { href: "/price-list", label: "Price List", icon: Tag },
  { href: "/stocks", label: "Stok Sisa", icon: Warehouse },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.match) {
    return item.match(pathname);
  }
  return pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
}

type AppSidebarProps = {
  userEmail?: string;
};

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname();
  const displayName = userEmail?.split("@")[0] ?? "Pengguna";
  const initial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <aside className="flex w-full flex-col border-b border-sidebar-border bg-sidebar md:sticky md:top-0 md:h-screen md:w-[17rem] md:border-r md:border-b-0">
      <div className="flex h-full flex-col p-4 md:p-5">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <TreePine className="size-5" strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="font-heading text-sm font-semibold leading-tight">Navigasi Aplikasi</h2>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Sistem batch/partai penjualan kayu
            </p>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
          {navItems.map((item) => {
            const isActive = isNavActive(pathname, item);
            const Icon = item.icon;

            return (
              <AppNavLink
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-90" strokeWidth={2} />
                {item.label}
              </AppNavLink>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-sidebar-border pt-4 md:block">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/80 px-3 py-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {userEmail ?? "Terautentikasi"}
              </p>
            </div>
          </div>
          <form action={signOutAction} className="mt-2">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 border-sidebar-border bg-card/80 text-sidebar-foreground shadow-sm"
            >
              <LogOut className="size-3.5" />
              Keluar
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
