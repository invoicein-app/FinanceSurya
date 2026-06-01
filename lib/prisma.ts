import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "pg";

import { env, prismaUsesDirectDatabaseUrl } from "@/lib/env";

/**
 * Transaction pooler Supabase (Supavisor mode transaksi, biasanya port 6543):
 * - `pgbouncer=true` → tetap disematkan untuk kompatibilitas URL / tooling lain.
 * - `connection_limit` di query string hanya dibaca engine Rust Prisma; untuk adapter `pg`
 *   kita set `max` pool secara eksplisit di bawah.
 */
function augmentSupabasePoolerUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const port = u.port || "5432";
    const likelyTransactionPooler =
      host.includes("pooler.supabase.com") || port === "6543";

    if (likelyTransactionPooler) {
      u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connection_limit")) {
        u.searchParams.set("connection_limit", "1");
      }
    }
    return u.toString();
  } catch {
    return raw;
  }
}

function resolvePrismaDatasourceUrl(): string {
  if (prismaUsesDirectDatabaseUrl()) {
    return env.DIRECT_URL;
  }
  return augmentSupabasePoolerUrl(env.DATABASE_URL);
}

function isLikelySupabaseTransactionPoolerUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const port = u.port || "5432";
    return host.includes("pooler.supabase.com") || port === "6543";
  } catch {
    return false;
  }
}

/** Pool `pg` + adapter: menghindari connector Rust Prisma yang sering memicu `08P01` lewat Supavisor. */
function createPgAdapter(): PrismaPg {
  const connectionString = resolvePrismaDatasourceUrl();
  const cfg: PoolConfig = {
    connectionString,
    connectionTimeoutMillis: 30_000,
  };
  if (isLikelySupabaseTransactionPoolerUrl(connectionString)) {
    cfg.max = 1;
  }
  return new PrismaPg(cfg);
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      adapter: createPgAdapter(),
    });
  }
  return globalForPrisma.prisma;
}

/**
 * Proxy — baru bikin adapter / parse env saat ada akses pertama ke client,
 * supaya `next build` di Vercel tidak gagal di tahap collect page data bila modul ikut termuat.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: PropertyKey) {
    const inst = getPrismaClient();
    const value = Reflect.get(inst as unknown as object, prop, inst as unknown as object);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(inst);
    }
    return value;
  },
});
