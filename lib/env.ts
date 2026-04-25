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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const readableErrors = parsedEnv.error.issues
    .map((issue) => `- ${issue.message}`)
    .join("\n");

  throw new Error(
    `Environment variable belum valid.\n${readableErrors}\n\nSalin .env.example ke .env.local lalu isi semua value yang dibutuhkan.`,
  );
}

export const env = parsedEnv.data;
