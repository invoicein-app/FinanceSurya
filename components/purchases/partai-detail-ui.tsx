import type { ReactNode } from "react";

import { TABLE_HEAD_CLASS } from "@/components/layout/dashboard-table";
import { DetailTableShell } from "@/components/layout/app-theme-ui";
import { cn } from "@/lib/utils";

export { DetailTableShell };

/** Gaya kartu detail partai — konsisten di seluruh halaman. */
export const partaiDetailCardClass =
  "shadow-sm ring-1 ring-foreground/10 bg-card";

type AnalysisSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function AnalysisSection({
  title,
  description,
  children,
  className,
}: AnalysisSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/70 bg-gradient-to-b from-muted/40 to-muted/20 p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 border-b border-border/50 pb-2.5">
        <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type KpiTileProps = {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  className?: string;
};

export function KpiTile({ label, value, hint, highlight, className }: KpiTileProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3 shadow-sm",
        highlight
          ? "border-primary/20 bg-primary/5"
          : "border-border/60 bg-background/80",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 tabular-nums tracking-tight",
          highlight ? "text-xl font-bold text-foreground" : "text-lg font-semibold",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type InfoFieldProps = {
  label: string;
  value: string;
};

export function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-snug">{value}</dd>
    </div>
  );
}

type DistributionBarProps = {
  label: string;
  valueLabel: string;
  percent: number;
  barClassName?: string;
};

export function DistributionBar({
  label,
  valueLabel,
  percent,
  barClassName,
}: DistributionBarProps) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium" title={label}>
          {label}
        </span>
        <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {valueLabel}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/80">
        <div
          className={cn("h-full rounded-full bg-primary/75", barClassName)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

const GRADE_ACCENT: Record<string, string> = {
  A: "border-emerald-500/25 bg-emerald-500/8",
  B: "border-amber-500/25 bg-amber-500/8",
  C: "border-orange-500/25 bg-orange-500/8",
};

type GradeMiniCardProps = {
  grade: string;
  qty: number;
  sharePercent: number;
};

/** Panel isi di dalam kartu detail (form, tabel, daftar). */
export function DetailContentPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-gradient-to-b from-muted/35 to-muted/10 p-4 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DetailHintBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function DetailEmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/** @deprecated Pakai TABLE_HEAD_CLASS dari app-theme-ui. */
export function detailTableHeadClass() {
  return TABLE_HEAD_CLASS;
}

export function GradeMiniCard({ grade, qty, sharePercent }: GradeMiniCardProps) {
  const accent = GRADE_ACCENT[grade] ?? "border-border/60 bg-background/80";

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border px-2 py-3 text-center shadow-sm",
        accent,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Grade {grade}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums leading-none tracking-tight">
        {qty.toLocaleString("id-ID")}
      </p>
      <p className="mt-2 text-xs font-medium tabular-nums text-muted-foreground">
        {sharePercent.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
      </p>
    </div>
  );
}
