import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireUserOrRedirect } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireUserOrRedirect();

  return <AppShell userEmail={user.email ?? undefined}>{children}</AppShell>;
}
