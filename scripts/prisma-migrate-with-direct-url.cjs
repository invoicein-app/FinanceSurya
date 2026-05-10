/**
 * Jalankan Prisma CLI dengan DATABASE_URL = DIRECT_URL (koneksi langsung Postgres).
 * Supabase transaction pooler (:6543) sering macet / gagal untuk DDL migrate deploy.
 *
 * Usage (dari folder web): node scripts/prisma-migrate-with-direct-url.cjs migrate deploy
 */
const path = require("path");
const { spawnSync } = require("child_process");
const { config } = require("dotenv");

config({
  path: path.join(__dirname, "..", ".env.local"),
  override: false,
});

const direct = process.env.DIRECT_URL?.trim();
if (!direct) {
  console.error("DIRECT_URL kosong di .env.local — isi URI Postgres langsung (biasanya db.<project>.supabase.co:5432).");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Contoh: node scripts/prisma-migrate-with-direct-url.cjs migrate deploy');
  process.exit(1);
}

console.log("Migrate memakai DIRECT_URL (bukan pooler DATABASE_URL).\n");

const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
  env: { ...process.env, DATABASE_URL: direct },
});

process.exit(result.status ?? 1);
