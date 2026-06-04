import { requireUser } from "@/lib/auth/session";

/** Call at the start of every protected server action. */
export async function ensureAuthenticated(): Promise<void> {
  await requireUser();
}
