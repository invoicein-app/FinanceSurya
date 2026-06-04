import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DataListCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  description?: string;
  badge?: string;
  footer?: ReactNode;
};

export function DataListCard({
  title,
  children,
  className,
  description,
  badge,
  footer,
}: DataListCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--table-card-border)] bg-card shadow-[0_1px_2px_oklch(0.2_0.02_155/0.04),0_8px_24px_oklch(0.2_0.02_155/0.06)]",
        className,
      )}
    >
      <CardHeader className="gap-1 border-b border-[var(--table-border)] bg-gradient-to-b from-[var(--table-card-header)] to-card px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="font-heading text-base font-semibold tracking-tight text-foreground">
              {title}
            </CardTitle>
            {description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {badge ? (
            <Badge
              variant="secondary"
              className="shrink-0 border border-primary/15 bg-primary/8 font-medium text-primary"
            >
              {badge}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
      {footer ? (
        <div className="border-t border-[var(--table-border)] px-5 py-3 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
