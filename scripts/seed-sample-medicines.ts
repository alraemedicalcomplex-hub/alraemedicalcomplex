import prisma from "../src/lib/prisma";

export async function seedSampleMedicines() {
  const pharmacyId = "00000000-0000-0000-0000-000000000001";
  const user = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!user) throw new Error("No super admin user found");

  const categories = await prisma.category.findMany();
  const manufacturers = await prisma.manufacturer.findMany();

  const getCat = (name: string) => categories.find((c) => c.name.toLowerCase().includes(name.toLowerCase()))?.id || categories[0].id;
  const getMfg = (name: string) => manufacturers.find((m) => m.name.toLowerCase().includes(name.toLowerCase()))?.id || manufacturers[0].id;

  const sampleMeds = [
    {
      name: "Panadol 500mg",
      genericName: "Paracetamol",
      brandName: "Panadol",
      categoryId: getCat("Analgesic"),
      manufacturerId: getMfg("GSK"),
      dosageForm: "TABLET" as const,
      strength: "500mg",
      packSize: 200,
      unitOfMeasure: "Tablets",
      barcode: "8964000123456",
      sku: "MED-PAN-500",
      prescriptionRequired: false,
      minStockLevel: 50,
      maxStockLevel: 1000,
      price: 3.5,
      cost: 2.7,
      trade: 3.1,
    },
    {
      name: "Augmentin 625mg",
      genericName: "Amoxicillin + Clavulanic Acid",
      brandName: "Augmentin",
      categoryId: getCat("Antibiotic"),
      manufacturerId: getMfg("GSK"),
      dosageForm: "TABLET" as const,
      strength: "625mg",
      packSize: 14,
      unitOfMeasure: "Tablets",
      barcode: "8964000234567",
      sku: "MED-AUG-625",
      prescriptionRequired: true,
      minStockLevel: 20,
      maxStockLevel: 200,
      price: 38.0,
      cost: 29.5,
      trade: 34.0,
    },
    {
      name: "Risek 20mg",
      genericName: "Omeprazole",
      brandName: "Risek",
      categoryId: getCat("Antacid"),
      manufacturerId: getMfg("Getz"),
      dosageForm: "CAPSULE" as const,
      strength: "20mg",
      packSize: 14,
      unitOfMeasure: "Capsules",
      barcode: "8964000345678",
      sku: "MED-RSK-20",
      prescriptionRequired: false,
      minStockLevel: 25,
      maxStockLevel: 300,
      price: 24.5,
      cost: 18.0,
      trade: 21.5,
    },
    {
      name: "Brufen 400mg",
      genericName: "Ibuprofen",
      brandName: "Brufen",
      categoryId: getCat("Analgesic"),
      manufacturerId: getMfg("Abbott"),
      dosageForm: "TABLET" as const,
      strength: "400mg",
      packSize: 30,
      unitOfMeasure: "Tablets",
      barcode: "8964000456789",
      sku: "MED-BRU-400",
      prescriptionRequired: false,
      minStockLevel: 30,
      maxStockLevel: 400,
      price: 7.2,
      cost: 5.5,
      trade: 6.4,
    },
  ];

  for (const m of sampleMeds) {
    const med = await prisma.medicine.create({
      data: {
        pharmacyId,
        name: m.name,
        genericName: m.genericName,
        brandName: m.brandName,
        categoryId: m.categoryId,
        manufacturerId: m.manufacturerId,
        dosageForm: m.dosageForm,
        strength: m.strength,
        packSize: m.packSize,
        unitOfMeasure: m.unitOfMeasure,
        barcode: m.barcode,
        sku: m.sku,
        prescriptionRequired: m.prescriptionRequired,
        minStockLevel: m.minStockLevel,
        maxStockLevel: m.maxStockLevel,
      },
    });

    const batch = await prisma.medicineBatch.create({
      data: {
        pharmacyId,
        medicineId: med.id,
        batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
        purchaseCost: m.cost,
        tradePrice: m.trade,
        retailPrice: m.price,
        quantity: 100,
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        status: "ACTIVE",
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        batchId: batch.id,
        type: "OPENING_STOCK",
        quantityDelta: 100,
        balanceAfter: 100,
        unitCost: m.cost,
        referenceId: "INITIAL-STOCK",
        notes: "Initial inventory setup",
        userId: user.id,
      },
    });
  }

  console.log("Sample medicines created successfully.");
}

if (require.main === module) {
  seedSampleMedicines()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
    });
}
