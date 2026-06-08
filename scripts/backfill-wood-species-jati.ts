import { config } from "dotenv";

config({ path: ".env.local", override: false });

import { prisma } from "../lib/prisma";

async function main() {
  const result = await prisma.woodPurchase.updateMany({
    data: { woodSpecies: "Jati" },
  });
  console.log(`Updated ${result.count} partai to woodSpecies = Jati`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
