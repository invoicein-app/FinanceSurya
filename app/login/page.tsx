import Link from "next/link";
import { TreePine } from "lucide-react";

import { signInAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  missing_fields: "Email dan kata sandi wajib diisi.",
  invalid_credentials: "Email atau kata sandi tidak valid.",
  auth_callback: "Gagal menyelesaikan login. Coba lagi.",
  missing_code: "Link login tidak valid atau sudah kedaluwarsa.",
  config: "Konfigurasi autentikasi belum lengkap.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/";
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-surface)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <TreePine className="size-6" strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Masuk ke Aplikasi
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Akses internal hanya untuk pengguna yang sudah login.
            </p>
          </div>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-[var(--table-card-border)] bg-card p-6 shadow-[0_8px_24px_oklch(0.2_0.02_155/0.08)]",
          )}
        >
          {errorMessage ? (
            <p
              className="mb-4 rounded-lg border border-destructive/35 bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <form action={signInAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full shadow-sm">
              Masuk
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Deployment pribadi — pastikan akun Supabase Auth sudah dibuat untuk pengguna
          Anda.{" "}
          <Link href="https://supabase.com/docs/guides/auth" className="underline">
            Dokumentasi Auth
          </Link>
        </p>
      </div>
    </main>
  );
}
