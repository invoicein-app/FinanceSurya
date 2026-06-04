import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type AppListPageProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppListPage({ title, description, icon: Icon, actions, children }: AppListPageProps) {
  return (
    <main className="min-h-full bg-[var(--app-surface)] px-4 py-8 md:px-8 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15">
              <Icon className="size-5" strokeWidth={2} />
            </span>
          ) : null}
          <div className="space-y-0.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[1.65rem]">
              {title}
            </h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}
