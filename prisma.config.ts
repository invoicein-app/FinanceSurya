import { config } from "dotenv";
import { defineConfig } from "prisma/config";

/** override: false — izinkan skrip (mis. prisma-migrate-with-direct-url) men-set DATABASE_URL dulu. */
config({ path: ".env.local", override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
    directUrl: process.env["DIRECT_URL"]?.trim() || undefined,
  },
});
