/**
 * Diagnosa cepat DATABASE_URL & DIRECT_URL (.env.local).
 * Tidak mencetak password — hanya host/port dan hasil SELECT 1.
 *
 * Usage (dari folder web): node scripts/check-env-urls.cjs
 */
const path = require("path");
const { config } = require("dotenv");
const { PrismaClient } = require("@prisma/client");

config({ path: path.join(__dirname, "..", ".env.local") });

function augmentSupabasePoolerUrl(rawInput) {
  const raw = String(rawInput).trim().replace(/^["']|["']$/g, "");
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

function summarize(url, label) {
  if (!url || String(url).trim() === "") {
    console.log(`${label}: (kosong — tidak ada di .env.local atau nama salah)`);
    return false;
  }
  const raw = String(url).trim().replace(/^["']|["']$/g, "");
  try {
    const normalized = raw.replace(/^postgresql:/i, "http:").replace(/^postgres:/i, "http:");
    const u = new URL(normalized);
    const port = u.port || "5432";
    console.log(`${label}: bentuk OK → host=${u.hostname} port=${port} path=${u.pathname || "/"}`);
    return true;
  } catch (e) {
    console.log(`${label}: bukan URL valid → ${e.message}`);
    console.log(`         awalan string (40 char): ${JSON.stringify(raw.slice(0, 40))}`);
    return false;
  }
}

async function ping(label, url) {
  const raw = url ? augmentSupabasePoolerUrl(String(url).trim().replace(/^["']|["']$/g, "")) : "";
  if (!raw) {
    return;
  }
  const prisma = new PrismaClient({
    datasources: { db: { url: raw } },
    log: [],
  });
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log(`${label}: SELECT 1 berhasil\n`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`${label}: SELECT 1 gagal`);
    console.log(`         ${msg.replace(/\n/g, "\n         ")}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("Memuat .env.local dari folder web …\n");
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const useDirect = /^true|1$/i.test(
    String(process.env.PRISMA_DATABASE_USE_DIRECT ?? "").trim(),
  );
  console.log(
    `Prisma app runtime URL: ${useDirect ? "DIRECT_URL (PRISMA_DATABASE_USE_DIRECT)" : "DATABASE_URL (+ augment pooler bila perlu)"}\n`,
  );

  summarize(dbUrl, "DATABASE_URL");
  summarize(directUrl, "DIRECT_URL");

  console.log("--- Uji koneksi (butuh jaringan ke Supabase) ---\n");
  await ping("DATABASE_URL", dbUrl);
  await ping("DIRECT_URL", directUrl);

  console.log("Selesai.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
