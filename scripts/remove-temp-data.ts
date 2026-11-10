import prisma from "../src/lib/prisma";

async function main() {
  console.log("Removing all temporary & demo data from Al Rae Hospital database...");

  // Execute raw TRUNCATE CASCADE on all operational and demo tables
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      sale_return_items,
      sale_returns,
      sale_payments,
      sale_batches,
      sale_items,
      sales,
      purchase_returns,
      purchase_items,
      purchases,
      supplier_payments,
      cash_transactions,
      cash_registers,
      prescription_items,
      prescriptions,
      financial_transactions,
      expenses,
      notifications,
      audit_logs,
      inventory_movements,
      medicine_batches,
      medicines,
      customers,
      suppliers
    CASCADE;
  `);

  console.log("All temporary data truncated successfully.");

  // Verify remaining records
  const pharmacy = await prisma.pharmacy.findFirst();
  const users = await prisma.user.findMany({ select: { id: true, fullName: true, email: true, role: true } });
  const categoryCount = await prisma.category.count();
  const manufacturerCount = await prisma.manufacturer.count();
  const medCount = await prisma.medicine.count();
  const batchCount = await prisma.medicineBatch.count();
  const saleCount = await prisma.sale.count();
  const customerCount = await prisma.customer.count();
  const supplierCount = await prisma.supplier.count();

  console.log({
    pharmacy: pharmacy?.name,
    users,
    categories: categoryCount,
    manufacturers: manufacturerCount,
    medicines: medCount,
    batches: batchCount,
    sales: saleCount,
    customers: customerCount,
    suppliers: supplierCount,
  });
}

main()
  .catch((e) => {
    console.error("Failed to remove temp data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
