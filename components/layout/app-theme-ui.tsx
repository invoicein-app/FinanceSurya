import type { ReactNode } from "react";

import {
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
} from "@/components/layout/dashboard-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export {
  TABLE_HEAD_CLASS,
  TABLE_HEADER_ROW_CLASS,
  TABLE_BODY_ROW_CLASS,
  TABLE_CELL_DATE,
  TABLE_CELL_PRIMARY,
  TABLE_CELL_VENDOR,
  TABLE_CELL_MUTED,
  TABLE_CELL_NUMERIC,
  TABLE_CELL_AMOUNT,
  TABLE_CELL_ACTIONS,
  TABLE_CELL_DEFAULT,
  TABLE_EMPTY_CELL,
  TABLE_ACTION_BTN_VIEW,
  TABLE_ACTION_BTN_DELETE,
  TABLE_ALERT_BANNER,
  DashboardTableArea,
  DashboardDataTable,
  DataTableLink,
  TABLE_MOBILE_CARD_CLASS,
} from "@/components/layout/dashboard-table";

export const SELECT_FIELD_CLASS =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export const FORM_CARD_CLASS =
  "overflow-hidden rounded-2xl border border-[var(--table-card-border)] bg-card shadow-[0_1px_2px_oklch(0.2_0.02_155/0.04),0_8px_24px_oklch(0.2_0.02_155/0.06)]";

type FormSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSectionCard({
  title,
  description,
  children,
  className,
}: FormSectionCardProps) {
  return (
    <Card className={cn(FORM_CARD_CLASS, className)}>
      <CardHeader className="border-b border-[var(--table-border)] bg-gradient-to-b from-[var(--table-card-header)] to-card px-5 py-5 sm:px-6">
        <CardTitle className="font-heading text-base font-semibold tracking-tight">{title}</CardTitle>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="px-5 pt-6 pb-6 sm:px-6">{children}</CardContent>
    </Card>
  );
}

export function DetailTableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--table-card-border)] bg-card shadow-[0_1px_2px_oklch(0.2_0.02_155/0.04),0_8px_20px_oklch(0.2_0.02_155/0.05)] ring-1 ring-foreground/[0.04]">
      <div data-dashboard-table className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

export function PageEmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-[var(--table-card-border)] bg-[var(--table-footer)] px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
