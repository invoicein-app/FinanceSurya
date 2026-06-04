import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Header row — no hover tint. */
export const TABLE_HEADER_ROW_CLASS = "border-b-0 hover:bg-transparent";

/**
 * Elegant admin table header cells.
 * Pair with `TABLE_HEADER_ROW_CLASS` on `TableRow`.
 */
export const TABLE_HEAD_CLASS =
  "h-12 border-b border-[var(--table-border)] bg-[var(--table-header)] px-4 text-[0.68rem] font-semibold uppercase tracking-[0.07em] text-muted-foreground first:pl-5 last:pr-5";

/** Data rows — generous padding, subtle separators, desktop hover. */
export const TABLE_BODY_ROW_CLASS =
  "group border-b border-[var(--table-border)]/70 transition-[background-color,box-shadow] last:border-0 hover:bg-[var(--table-row-hover)] md:hover:shadow-[inset_3px_0_0_0_var(--primary)]";

/** Clickable row variant (e.g. entire row is a link target). */
export const TABLE_BODY_ROW_INTERACTIVE_CLASS =
  "cursor-pointer hover:bg-[var(--table-row-hover)] active:bg-[var(--table-row-hover)]";

const TABLE_CELL_BASE = "px-4 py-4 align-middle first:pl-5 last:pr-5";

export const TABLE_CELL_DEFAULT = cn(TABLE_CELL_BASE, "text-sm text-foreground/90");

export const TABLE_CELL_DATE = cn(
  TABLE_CELL_BASE,
  "whitespace-nowrap text-sm tabular-nums text-muted-foreground",
);

export const TABLE_CELL_PRIMARY = cn(
  TABLE_CELL_BASE,
  "text-sm font-semibold tracking-tight text-foreground",
);

export const TABLE_CELL_VENDOR = cn(TABLE_CELL_BASE, "text-sm text-foreground/85");

export const TABLE_CELL_MUTED = cn(TABLE_CELL_BASE, "text-sm text-muted-foreground");

export const TABLE_CELL_NUMERIC = cn(
  TABLE_CELL_BASE,
  "text-right text-sm tabular-nums text-foreground/90",
);

export const TABLE_CELL_AMOUNT = cn(
  TABLE_CELL_BASE,
  "text-right text-[0.9375rem] font-bold tabular-nums tracking-tight text-foreground",
);

export const TABLE_CELL_ACTIONS = cn(TABLE_CELL_BASE, "text-right align-middle");

export const TABLE_EMPTY_CELL = cn(
  TABLE_CELL_BASE,
  "py-14 text-center text-sm text-muted-foreground",
);

export const TABLE_ACTION_BTN_VIEW =
  "gap-1 border-primary/25 bg-background shadow-sm text-primary hover:border-primary/40 hover:bg-primary/8 hover:text-primary";

export const TABLE_ACTION_BTN_DELETE =
  "gap-1 border-destructive/25 bg-background shadow-sm text-destructive hover:border-destructive/40 hover:bg-destructive/8 hover:text-destructive";

export const TABLE_ALERT_BANNER =
  "mx-5 mb-4 mt-5 rounded-lg border border-destructive/35 bg-destructive/8 px-3 py-2.5 text-sm text-destructive";

type DashboardTableAreaProps = {
  children: ReactNode;
  className?: string;
};

/** Mobile list card — selaras modul tabel dashboard. */
export const TABLE_MOBILE_CARD_CLASS =
  "rounded-xl border border-[var(--table-card-border)] bg-gradient-to-b from-card to-[var(--table-footer)] p-4 text-sm shadow-sm";

/** Scroll wrapper + scope gaya tabel dashboard (header, row hover, dll.). */
export function DashboardTableArea({ children, className }: DashboardTableAreaProps) {
  return (
    <div data-dashboard-table className={cn("overflow-x-auto", className)}>
      {children}
    </div>
  );
}

/** Alias — semua tabel data list pakai ini. */
export const DashboardDataTable = DashboardTableArea;

type DataTableLinkProps = ComponentProps<typeof Link>;

export function DataTableLink({ className, ...props }: DataTableLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 transition-colors",
        "hover:text-primary/90 hover:underline",
        "group-hover:underline",
        className,
      )}
      {...props}
    />
  );
}
