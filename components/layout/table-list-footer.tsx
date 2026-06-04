"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { SELECT_FIELD_CLASS } from "@/components/layout/app-theme-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type TableListFooterProps = {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  entityLabel: string;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
};

export function TableListFooter({
  rangeStart,
  rangeEnd,
  total,
  entityLabel,
  pageSize,
  onPageSizeChange,
  page,
  totalPages,
  onPageChange,
  className,
}: TableListFooterProps) {
  if (total === 0) {
    return null;
  }

  const showPager =
    page !== undefined && totalPages !== undefined && onPageChange !== undefined && totalPages > 0;
  const safePage = page ?? 1;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t border-[var(--table-border)] bg-[var(--table-footer)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Menampilkan{" "}
        <span className="font-semibold text-foreground">
          {rangeStart} – {rangeEnd}
        </span>{" "}
        dari <span className="font-semibold text-foreground">{total}</span> {entityLabel}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {showPager ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="bg-card shadow-sm"
              disabled={safePage <= 1}
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="flex min-w-9 items-center justify-center rounded-lg bg-primary px-2.5 py-1 text-sm font-semibold text-primary-foreground shadow-sm">
              {safePage}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="bg-card shadow-sm"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Per halaman
          <select
            className={cn(SELECT_FIELD_CLASS, "h-9 min-w-[4.5rem]")}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
