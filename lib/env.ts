import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL belum diisi di .env.local"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL belum diisi di .env.local"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL belum diisi di .env.local"),
  /**
   * Set true untuk Next.js dev / Node panjang: Prisma memakai DIRECT_URL (sesi Postgres),
   * hindari Supavisor transaction pooler yang sering memicu 08P01 dengan query engine Prisma.
   */
  PRISMA_DATABASE_USE_DIRECT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/** Lazy parse — `next build` Vercel memuat modul tanpa env sampai halaman benar-benar dipanggil. */
function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const readableErrors = parsed.error.issues.map((issue) => `- ${issue.message}`).join("\n");

    throw new Error(
      `Environment variable belum valid.\n${readableErrors}\n\nSalin .env.example ke .env.local lalu isi semua value yang dibutuhkan.\nDi Vercel: Project Settings → Environment Variables.`,
    );
  }
  return parsed.data;
}

export function getEnv(): Env {
  cachedEnv ??= loadEnv();
  return cachedEnv;
}

/** Proxy supaya import `@/lib/env` tidak mem-parse env sampai property pertama diakses. */
export const env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    return getEnv()[prop];
  },
});

export function prismaUsesDirectDatabaseUrl(): boolean {
  const v = getEnv().PRISMA_DATABASE_USE_DIRECT?.trim().toLowerCase();
  return v === "true" || v === "1";
}
