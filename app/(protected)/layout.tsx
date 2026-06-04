import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireUserOrRedirect } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireUserOrRedirect();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar userEmail={user.email ?? undefined} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
