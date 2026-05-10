import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vendors = [
    { name: "PT Hutan Lestari" },
    { name: "UD Kayu Makmur" },
    { name: "CV Log Sentosa" },
  ];

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { name: vendor.name },
      update: { name: vendor.name },
      create: vendor,
    });
  }

  const customers = [
    { name: "Toko Barokah" },
    { name: "UD Maju Jaya" },
    { name: "CV Sumber Rezeki" },
    { name: "Bapak Andi" },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { name: customer.name },
      update: {
        name: customer.name,
      },
      create: customer,
    });
  }

  const vendor = await prisma.vendor.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!vendor) {
    return;
  }

  const existingPurchase = await prisma.woodPurchase.findFirst({
    where: { batchCode: "TRUK-APR26-001" },
  });

  if (!existingPurchase) {
    await prisma.woodPurchase.create({
      data: {
        vendorId: vendor.id,
        purchaseDate: new Date(),
        batchCode: "TRUK-APR26-001",
        documentNumber: "SJ-TRK-001",
        note: "Partai seed contoh awal",
        bpCost: "1500000",
        cuttingCost: "300000",
        shippingCost: "500000",
        woodPrice: "0",
        grandTotal: "2300000",
        items: {
          create: [
            {
              noKapling: "A-01",
              woodType: "Meranti",
              sort: "A",
              length: "400",
              diameter: "35",
              logQty: "12",
              volume: "8.220",
              mutu: "5",
              status: "Fresh",
              amount: "7200000",
              remainingQty: "12",
              remainingVolume: "8.220",
              note: "Kayu panjang campur",
            },
            {
              noKapling: "A-02",
              woodType: "Kamper",
              sort: "B",
              length: "300",
              diameter: "28",
              logQty: "9",
              volume: "5.640",
              mutu: "4",
              status: "Dry",
              amount: "3800000",
              remainingQty: "9",
              remainingVolume: "5.640",
              note: "Partai campuran",
            },
          ],
        },
      },
    });
  }

  /** Stok veneer per ketebalan standar: 0.6 & 1.2 mm, qty awal 0 (selaras dengan partai baru — satuan m²). */
  const defaultThicknessRows: { thicknessMm: string; qty: string; unit: string }[] = [
    { thicknessMm: "0.6", qty: "0", unit: "m2" },
    { thicknessMm: "1.2", qty: "0", unit: "m2" },
  ];

  const allPurchases = await prisma.woodPurchase.findMany({ select: { id: true } });
  for (const purchase of allPurchases) {
    for (const row of defaultThicknessRows) {
      const existing = await prisma.woodPurchaseThicknessStock.findUnique({
        where: {
          purchaseId_thicknessMm: {
            purchaseId: purchase.id,
            thicknessMm: row.thicknessMm,
          },
        },
      });
      if (!existing) {
        await prisma.woodPurchaseThicknessStock.create({
          data: {
            purchaseId: purchase.id,
            thicknessMm: row.thicknessMm,
            qtyAvailable: row.qty,
            unit: row.unit,
          },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed gagal dijalankan:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
