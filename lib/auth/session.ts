import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { UnauthorizedError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

function getAllowedEmails(): string[] | null {
  const raw = process.env.ALLOWED_APP_EMAILS?.trim();
  if (!raw) {
    return null;
  }
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.length > 0 ? emails : null;
}

function assertAllowedEmail(user: User): void {
  const allowed = getAllowedEmails();
  if (!allowed) {
    return;
  }
  const email = user.email?.trim().toLowerCase();
  if (!email || !allowed.includes(email)) {
    throw new UnauthorizedError("Akun ini tidak diizinkan mengakses aplikasi.");
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  try {
    assertAllowedEmail(user);
  } catch {
    return null;
  }

  return user;
}

/** Server actions & mutations — throws when not authenticated. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

/** Server Components / pages — redirect to login. */
export async function requireUserOrRedirect(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const query = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${query}`);
  }
  return user;
}
