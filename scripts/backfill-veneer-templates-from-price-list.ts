/**
 * Salin histori CustomerPriceList → VeneerTemplate per customer.
 *
 * Usage (dari folder web):
 *   npm run backfill:templates
 *   npm run backfill:templates -- --customer=<customerId>
 */
import { config } from "dotenv";

import { backfillVeneerTemplatesFromPriceList } from "@/lib/services/veneer-template-service";

config({ path: ".env.local", override: false });

function readCustomerIdArg(): string | undefined {
  const flag = process.argv.find((arg) => arg.startsWith("--customer="));
  if (!flag) {
    return undefined;
  }
  const value = flag.slice("--customer=".length).trim();
  return value.length > 0 ? value : undefined;
}

async function main() {
  const customerId = readCustomerIdArg();
  const result = await backfillVeneerTemplatesFromPriceList(
    customerId ? { customerId } : undefined,
  );

  console.log(
    `Backfill selesai — inserted: ${result.inserted}, updated: ${result.updated}, skipped: ${result.skipped}${
      customerId ? ` (customer ${customerId})` : ""
    }`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
