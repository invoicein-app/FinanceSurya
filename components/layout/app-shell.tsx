"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  NavContentLoadingOverlay,
  NavProgressProvider,
  useNavProgress,
} from "@/components/nav-progress-context";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  userEmail?: string;
};

function AppShellMain({ children }: { children: ReactNode }) {
  const nav = useNavProgress();

  return (
    <main className="app-shell-main relative min-w-0 flex-1">
      <div
        className={cn(
          "app-shell-main__inner min-h-full",
          nav.isContentLoading && "app-shell-main__inner--loading",
        )}
      >
        {children}
      </div>
      {nav.isContentLoading ? (
        <NavContentLoadingOverlay kind={nav.pendingKind ?? "navigate"} />
      ) : null}
    </main>
  );
}

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <NavProgressProvider>
      <div className="app-shell flex min-h-screen flex-col md:flex-row">
        <AppSidebar userEmail={userEmail} />
        <AppShellMain>{children}</AppShellMain>
      </div>
    </NavProgressProvider>
  );
}
