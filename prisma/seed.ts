import { PrismaClient, UserRole, DosageForm, StorageCondition, BatchStatus, MovementType, PaymentMethod, PaymentStatus, SaleStatus, ExpenseCategory, RegisterStatus, CashTransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Pharmacy Management System Database for Pakistan...");

  // 1. Create Pharmacy Tenant
  const pharmacy = await prisma.pharmacy.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Sufi Pharmacy & Wellness",
      legalName: "Sufi Healthcare Private Limited",
      dslNumber: "DSL-LHR-2024-9812",
      ntnNumber: "4329012-7",
      strnNumber: "3277876123456",
      phone: "+92 42 35889900",
      email: "info@sufipharmacy.pk",
      address: "Plot 14-B, Commercial Zone, Phase 5 DHA",
      city: "Lahore",
      country: "Pakistan",
      currency: "PKR",
      timezone: "Asia/Karachi",
    },
  });

  // 2. Pharmacy Settings
  await prisma.pharmacySettings.upsert({
    where: { pharmacyId: pharmacy.id },
    update: {},
    create: {
      pharmacyId: pharmacy.id,
      lowStockThreshold: 15,
      expiryAlertDays: 90,
      invoicePrefix: "INV-2026-",
      purchaseOrderPrefix: "PO-2026-",
      defaultTaxRate: 0.00,
      thermalPrinterWidth: "80mm",
      receiptFooterMessage: "Medicines sold without refrigeration guarantee cannot be returned after 3 days. Wish you speedy recovery!",
      enableLoyaltyPoints: true,
      fefoEnabled: true,
    },
  });

  // 3. Seed Users across all 7 Roles
  const passwordHash = await bcrypt.hash("Admin@Pharmacy2026!", 10);
  const staffHash = await bcrypt.hash("Staff@Pharmacy2026!", 10);

  const usersData = [
    {
      email: "admin@pharmacy.local",
      fullName: "Dr. Tariq Mahmood (Super Admin)",
      role: UserRole.SUPER_ADMIN,
      passwordHash: passwordHash,
      phone: "+92 300 1234567",
    },
    {
      email: "manager@pharmacy.local",
      fullName: "Kamran Akram (Pharmacy Manager)",
      role: UserRole.MANAGER,
      passwordHash: staffHash,
      phone: "+92 301 2345678",
    },
    {
      email: "pharmacist@pharmacy.local",
      fullName: "Dr. Ayesha Siddiqa (Chief Pharmacist - Pharm.D)",
      role: UserRole.PHARMACIST,
      passwordHash: staffHash,
      phone: "+92 302 3456789",
    },
    {
      email: "cashier@pharmacy.local",
      fullName: "Zubair Ahmad (Senior Cashier)",
      role: UserRole.CASHIER,
      passwordHash: staffHash,
      phone: "+92 303 4567890",
    },
    {
      email: "inventory@pharmacy.local",
      fullName: "Hamza Farooq (Inventory Controller)",
      role: UserRole.INVENTORY_MANAGER,
      passwordHash: staffHash,
      phone: "+92 304 5678901",
    },
    {
      email: "accountant@pharmacy.local",
      fullName: "Bilal Raza (Lead Accountant)",
      role: UserRole.ACCOUNTANT,
      passwordHash: staffHash,
      phone: "+92 305 6789012",
    },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        pharmacyId: pharmacy.id,
        isActive: true,
      },
    });
    createdUsers[u.role] = user.id;
  }

  // 4. Seed Categories
  const categoriesData = [
    { name: "Antibiotics", description: "Broad-spectrum and targeted antimicrobial therapies" },
    { name: "Analgesics & Antipyretics", description: "Pain relief and fever reducers" },
    { name: "Cardiovascular", description: "Hypertension, cardiac glycosides, statins" },
    { name: "Gastrointestinal", description: "Proton pump inhibitors, antacids, anti-diarrheals" },
    { name: "Respiratory & Anti-Allergic", description: "Antihistamines, bronchodilators, cough syrups" },
    { name: "Antidiabetic", description: "Oral hypoglycemics, insulin sensitizers" },
    { name: "Nutraceuticals & Vitamins", description: "Multivitamins, zinc, calcium, iron supplements" },
    { name: "Medical Devices & Surgical", description: "Syringes, bandages, cannula, gloves" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: {
        pharmacyId_name: {
          pharmacyId: pharmacy.id,
          name: cat.name,
        },
      },
      update: {},
      create: {
        pharmacyId: pharmacy.id,
        name: cat.name,
        description: cat.description,
      },
    });
    categoryMap[cat.name] = record.id;
  }

  // 5. Seed Manufacturers
  const manufacturersData = [
    { name: "GSK Pakistan", country: "Pakistan" },
    { name: "Getz Pharma", country: "Pakistan" },
    { name: "Abbott Laboratories", country: "Pakistan" },
    { name: "Sami Pharmaceuticals", country: "Pakistan" },
    { name: "CCL Pharmaceuticals", country: "Pakistan" },
    { name: "Searle Pakistan Limited", country: "Pakistan" },
    { name: "Hilton Pharma", country: "Pakistan" },
  ];

  const manufacturerMap: Record<string, string> = {};
  for (const m of manufacturersData) {
    const record = await prisma.manufacturer.upsert({
      where: {
        pharmacyId_name: {
          pharmacyId: pharmacy.id,
          name: m.name,
        },
      },
      update: {},
      create: {
        pharmacyId: pharmacy.id,
        name: m.name,
        country: m.country,
      },
    });
    manufacturerMap[m.name] = record.id;
  }

  // 6. Seed Suppliers
  const suppliersData = [
    {
      name: "Universal Drug Distributors",
      contactPerson: "Muhammad Asif",
      phone: "+92 42 37461122",
      email: "orders@universaldrug.pk",
      address: "Circular Road, Urdu Bazar, Lahore",
      ntnNumber: "2871192-1",
      balance: 145000.0,
      paymentTerms: "Net 30 Days",
    },
    {
      name: "Allied Healthcare Logistics",
      contactPerson: "Rashid Minhas",
      phone: "+92 42 35912344",
      email: "sales@alliedhealth.pk",
      address: "Quaid-e-Azam Industrial Estate, Kot Lakhpat, Lahore",
      ntnNumber: "3491823-4",
      balance: 82500.0,
      paymentTerms: "Cash on Delivery",
    },
    {
      name: "Premier Pharma Link",
      contactPerson: "Zahid Khan",
      phone: "+92 51 4432199",
      email: "supply@premierlink.pk",
      address: "I-9 Industrial Area, Islamabad",
      ntnNumber: "1928472-8",
      balance: 0.0,
      paymentTerms: "Net 15 Days",
    },
  ];

  const supplierMap: Record<string, string> = {};
  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({
      where: { pharmacyId: pharmacy.id, name: s.name },
    });
    if (existing) {
      supplierMap[s.name] = existing.id;
    } else {
      const created = await prisma.supplier.create({
        data: { ...s, pharmacyId: pharmacy.id },
      });
      supplierMap[s.name] = created.id;
    }
  }

  // 7. Seed Customers
  const customersData = [
    {
      name: "Haji Muhammad Rafique",
      phone: "03008451122",
      email: "rafique.haji@gmail.com",
      address: "House 45, Street 8, Phase 5 DHA, Lahore",
      creditLimit: 25000,
      balance: 4500,
      loyaltyPoints: 120,
    },
    {
      name: "Begum Nasreen Akhtar",
      phone: "03214567891",
      email: "nasreen.akhtar@yahoo.com",
      address: "House 112, Sector C, Askari 10, Lahore",
      creditLimit: 15000,
      balance: 0,
      loyaltyPoints: 340,
    },
    {
      name: "Dr. Sohail Qureshi",
      phone: "03334981123",
      email: "dr.sohail@shalamarhospital.pk",
      address: "Doctors Colony, Gulberg III, Lahore",
      creditLimit: 50000,
      balance: 12800,
      loyaltyPoints: 85,
    },
  ];

  const customerMap: Record<string, string> = {};
  for (const c of customersData) {
    const existing = await prisma.customer.findFirst({
      where: { pharmacyId: pharmacy.id, phone: c.phone },
    });
    if (existing) {
      customerMap[c.name] = existing.id;
    } else {
      const created = await prisma.customer.create({
        data: { ...c, pharmacyId: pharmacy.id },
      });
      customerMap[c.name] = created.id;
    }
  }

  // 8. Seed Medicines & Batches
  const medicinesData = [
    {
      name: "Panadol 500mg Tablets",
      genericName: "Paracetamol",
      category: "Analgesics & Antipyretics",
      manufacturer: "GSK Pakistan",
      dosageForm: DosageForm.TABLET,
      strength: "500mg",
      packSize: 200,
      unitOfMeasure: "BOX",
      barcode: "8964000100123",
      sku: "PAN-500-200",
      drapRegNo: "001294",
      prescriptionRequired: false,
      storageCondition: StorageCondition.ROOM_TEMPERATURE,
      minStockLevel: 20,
      batches: [
        {
          batchNumber: "BTH-GSK-902",
          purchaseCost: 650.0,
          tradePrice: 720.0,
          retailPrice: 800.0,
          quantity: 45,
          expiryMonths: 18,
        },
        {
          batchNumber: "BTH-GSK-881",
          purchaseCost: 640.0,
          tradePrice: 710.0,
          retailPrice: 800.0,
          quantity: 12,
          expiryMonths: 2, // Expiring soon! (Within 60 days)
        },
      ],
    },
    {
      name: "Panadol CF Tablets",
      genericName: "Paracetamol / Pseudoephedrine / Chlorpheniramine",
      category: "Respiratory & Anti-Allergic",
      manufacturer: "GSK Pakistan",
      dosageForm: DosageForm.TABLET,
      strength: "500mg/30mg/2mg",
      packSize: 100,
      unitOfMeasure: "BOX",
      barcode: "8964000100192",
      sku: "PAN-CF-100",
      drapRegNo: "001844",
      prescriptionRequired: false,
      storageCondition: StorageCondition.ROOM_TEMPERATURE,
      minStockLevel: 15,
      batches: [
        {
          batchNumber: "BTH-CF-102",
          purchaseCost: 480.0,
          tradePrice: 535.0,
          retailPrice: 600.0,
          quantity: 28,
          expiryMonths: 14,
        },
      ],
    },
    {
      name: "Augmentin 625mg Tablets",
      genericName: "Amoxicillin / Clavulanic Acid",
      category: "Antibiotics",
      manufacturer: "GSK Pakistan",
      dosageForm: DosageForm.TABLET,
      strength: "625mg",
      packSize: 10,
      unitOfMeasure: "STRIP",
      barcode: "8964000100451",
      sku: "AUG-625-10",
      drapRegNo: "002931",
      prescriptionRequired: true,
      storageCondition: StorageCondition.ROOM_TEMPERATURE,
      minStockLevel: 25,
      batches: [
        {
          batchNumber: "AUG-24-001",
          purchaseCost: 290.0,
          tradePrice: 325.0,
          retailPrice: 365.0,
          quantity: 50,
          expiryMonths: 16,
        },
        {
          batchNumber: "AUG-23-990",
          purchaseCost: 280.0,
          tradePrice: 315.0,
          retailPrice: 365.0,
          quantity: 8, // Low quantity batch
          expiryMonths: 1, // Expiring very soon!
        },
      ],
    },
    {
      name: "Risek 20mg Capsules",
      genericName: "Omeprazole",
      category: "Gastrointestinal",
      manufacturer: "Getz Pharma",
      dosageForm: DosageForm.CAPSULE,
      strength: "20mg",
      packSize: 14,
      unitOfMeasure: "BOX",
      barcode: "8964000200881",
      sku: "RSK-20-14",
      drapRegNo: "008922",
      prescriptionRequired: false,
      storageCondition: StorageCondition.COOL_DRY_PLACE,
      minStockLevel: 30,
      batches: [
        {
          batchNumber: "RSK-GTZ-41",
          purchaseCost: 260.0,
          tradePrice: 290.0,
          retailPrice: 330.0,
          quantity: 85,
          expiryMonths: 22,
        },
      ],
    },
    {
      name: "Glucophage 500mg Tablets",
      genericName: "Metformin Hydrochloride",
      category: "Antidiabetic",
      manufacturer: "Abbott Laboratories",
      dosageForm: DosageForm.TABLET,
      strength: "500mg",
      packSize: 50,
      unitOfMeasure: "BOX",
      barcode: "8964000300128",
      sku: "GLU-500-50",
      drapRegNo: "003189",
      prescriptionRequired: true,
      storageCondition: StorageCondition.ROOM_TEMPERATURE,
      minStockLevel: 20,
      batches: [
        {
          batchNumber: "GLU-ABT-10",
          purchaseCost: 210.0,
          tradePrice: 235.0,
          retailPrice: 270.0,
          quantity: 60,
          expiryMonths: 20,
        },
      ],
    },
    {
      name: "Loprin 75mg Tablets",
      genericName: "Aspirin (Low Dose)",
      category: "Cardiovascular",
      manufacturer: "Getz Pharma",
      dosageForm: DosageForm.TABLET,
      strength: "75mg",
      packSize: 30,
      unitOfMeasure: "BOX",
      barcode: "8964000200334",
      sku: "LOP-75-30",
      drapRegNo: "007812",
      prescriptionRequired: false,
      storageCondition: StorageCondition.ROOM_TEMPERATURE,
      minStockLevel: 15,
      batches: [
        {
          batchNumber: "LOP-24-11",
          purchaseCost: 80.0,
          tradePrice: 90.0,
          retailPrice: 105.0,
          quantity: 110,
          expiryMonths: 24,
        },
      ],
    },
    {
      name: "Surbex Z Tablets",
      genericName: "Zinc + High Potency Vitamin B-Complex & Vitamin C",
      category: "Nutraceuticals & Vitamins",
      manufacturer: "Abbott Laboratories",
      dosageForm: DosageForm.TABLET,
      strength: "Zinc 22.5mg + Vit C 500mg",
      packSize: 30,
      unitOfMeasure: "BOTTLE",
      barcode: "8964000300771",
      sku: "SRB-Z-30",
      drapRegNo: "009941",
      prescriptionRequired: false,
      storageCondition: StorageCondition.COOL_DRY_PLACE,
      minStockLevel: 20,
      batches: [
        {
          batchNumber: "SRB-902",
          purchaseCost: 380.0,
          tradePrice: 420.0,
          retailPrice: 480.0,
          quantity: 42,
          expiryMonths: 19,
        },
      ],
    },
    {
      name: "Brufen 400mg Tablets",
      genericName: "Ibuprofen",
      category: "Analgesics & Antipyretics",
      manufacturer: "Abbott Laboratories",
      dosageForm: DosageForm.TABLET,
      strength: "400mg",
      packSize: 30,
      unitOfMeasure: "BOX",
      barcode: "8964000300444",
      sku: "BRU-400-30",
      drapRegNo: "001140",
      prescriptionRequired: false,
      storageCondition: StorageCondition.ROOM_TEMPERATURE,
      minStockLevel: 15,
      batches: [
        {
          batchNumber: "BRU-801",
          purchaseCost: 140.0,
          tradePrice: 160.0,
          retailPrice: 185.0,
          quantity: 70,
          expiryMonths: 21,
        },
      ],
    },
  ];

  for (const med of medicinesData) {
    const categoryId = categoryMap[med.category];
    const manufacturerId = manufacturerMap[med.manufacturer];

    const medicine = await prisma.medicine.upsert({
      where: { id: med.sku }, // using sku as idempotent identifier or look up
      update: {},
      create: {
        id: med.sku,
        pharmacyId: pharmacy.id,
        name: med.name,
        genericName: med.genericName,
        categoryId: categoryId,
        manufacturerId: manufacturerId,
        dosageForm: med.dosageForm,
        strength: med.strength,
        packSize: med.packSize,
        unitOfMeasure: med.unitOfMeasure,
        barcode: med.barcode,
        sku: med.sku,
        drapRegNo: med.drapRegNo,
        prescriptionRequired: med.prescriptionRequired,
        storageCondition: med.storageCondition,
        minStockLevel: med.minStockLevel,
      },
    });

    for (const b of med.batches) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + b.expiryMonths);

      const batch = await prisma.medicineBatch.create({
        data: {
          medicineId: medicine.id,
          batchNumber: b.batchNumber,
          manufacturingDate: new Date(Date.now() - 60 * 24 * 3600 * 1000),
          expiryDate: expiryDate,
          purchaseCost: b.purchaseCost,
          tradePrice: b.tradePrice,
          retailPrice: b.retailPrice,
          quantity: b.quantity,
          status: b.expiryMonths <= 0 ? BatchStatus.EXPIRED : BatchStatus.ACTIVE,
        },
      });

      // Log opening inventory movement
      await prisma.inventoryMovement.create({
        data: {
          batchId: batch.id,
          type: MovementType.OPENING_STOCK,
          quantityDelta: b.quantity,
          balanceAfter: b.quantity,
          unitCost: b.purchaseCost,
          notes: "Initial inventory setup & verified physical count",
          userId: createdUsers[UserRole.INVENTORY_MANAGER],
        },
      });
    }
  }

  // 9. Seed Active Cash Register
  const cashierId = createdUsers[UserRole.CASHIER];
  const activeRegister = await prisma.cashRegister.create({
    data: {
      pharmacyId: pharmacy.id,
      terminalName: "POS Counter 1 (Main Dispensary)",
      cashierId: cashierId,
      openingCash: 10000.0,
      status: RegisterStatus.OPEN,
    },
  });

  await prisma.cashTransaction.create({
    data: {
      cashRegisterId: activeRegister.id,
      type: CashTransactionType.OPENING_FLOAT,
      amount: 10000.0,
      description: "Morning opening cash float",
    },
  });

  // 10. Seed Realistic Sales Transactions
  const panadolMed = await prisma.medicine.findFirst({ where: { name: "Panadol 500mg Tablets" }, include: { batches: true } });
  const augmentinMed = await prisma.medicine.findFirst({ where: { name: "Augmentin 625mg Tablets" }, include: { batches: true } });
  const risekMed = await prisma.medicine.findFirst({ where: { name: "Risek 20mg Capsules" }, include: { batches: true } });

  if (panadolMed && augmentinMed && risekMed) {
    const sale1 = await prisma.sale.create({
      data: {
        pharmacyId: pharmacy.id,
        invoiceNumber: "INV-2026-00001",
        customerId: customerMap["Haji Muhammad Rafique"],
        cashierId: cashierId,
        subtotal: 1495.0,
        discountAmount: 45.0,
        taxAmount: 0.0,
        totalAmount: 1450.0,
        paidAmount: 1500.0,
        changeAmount: 50.0,
        saleStatus: SaleStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        notes: "Regular prescription refill",
        createdAt: new Date(Date.now() - 2 * 3600 * 1000),
        items: {
          create: [
            {
              medicineId: panadolMed.id,
              quantity: 1,
              unitPrice: 800.0,
              lineDiscount: 0.0,
              totalPrice: 800.0,
            },
            {
              medicineId: augmentinMed.id,
              quantity: 1,
              unitPrice: 365.0,
              lineDiscount: 0.0,
              totalPrice: 365.0,
            },
            {
              medicineId: risekMed.id,
              quantity: 1,
              unitPrice: 330.0,
              lineDiscount: 0.0,
              totalPrice: 330.0,
            },
          ],
        },
        payments: {
          create: {
            method: PaymentMethod.CASH,
            amount: 1450.0,
          },
        },
      },
    });

    // Record cash collection
    await prisma.cashTransaction.create({
      data: {
        cashRegisterId: activeRegister.id,
        type: CashTransactionType.SALE_COLLECTION,
        amount: 1450.0,
        description: `Sale Invoice #${sale1.invoiceNumber}`,
      },
    });
  }

  // 11. Seed Realistic Expenses
  const expensesData = [
    {
      title: "LESCO Commercial Electricity Bill",
      category: ExpenseCategory.UTILITIES,
      amount: 42500.0,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paidTo: "Lahore Electric Supply Company",
      notes: "Month of October billing",
    },
    {
      title: "Pharmacy Premises Rent (Advance)",
      category: ExpenseCategory.RENT,
      amount: 120000.0,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paidTo: "DHA Commercial Plaza Management",
      notes: "Commercial shop rental",
    },
    {
      title: "Thermal POS Paper Rolls & Disposables",
      category: ExpenseCategory.SUPPLIES,
      amount: 4800.0,
      paymentMethod: PaymentMethod.CASH,
      paidTo: "Paper House Lahore",
      notes: "80mm thermal receipt roll boxes",
    },
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: {
        ...exp,
        pharmacyId: pharmacy.id,
      },
    });
  }

  // 12. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        pharmacyId: pharmacy.id,
        title: "Short Expiry Warning",
        message: "Panadol 500mg (Batch BTH-GSK-881) is expiring within 60 days. Prioritize FEFO dispensing.",
        type: "EXPIRING_SOON" as unknown as any,
        linkUrl: "/expiry",
      },
      {
        pharmacyId: pharmacy.id,
        title: "Low Stock Alert",
        message: "Augmentin 625mg stock is low (8 packs remaining in primary batch).",
        type: "LOW_STOCK" as unknown as any,
        linkUrl: "/inventory",
      },
    ],
  });

  console.log("✅ Pharmacy Management System database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
