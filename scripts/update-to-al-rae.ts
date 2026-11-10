import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Updating pharmacy to Al Rae Hospital...");

  // 1. Update Pharmacy
  const pharmacyId = "00000000-0000-0000-0000-000000000001";
  await prisma.pharmacy.update({
    where: { id: pharmacyId },
    data: {
      name: "Al Rae Hospital",
      legalName: "Al Rae Hospital Private Limited",
      email: "info@alraehospital.pk",
    },
  });

  // 2. Hash Password for Sufiyan
  const hash = await bcrypt.hash("Password123!", 10);

  // 3. Upsert Sufiyan
  let sufiyan = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "sufiyan@alraehospital.pk" },
        { fullName: { contains: "Sufiyan", mode: "insensitive" } },
      ],
    },
  });

  if (!sufiyan) {
    sufiyan = await prisma.user.create({
      data: {
        pharmacyId,
        fullName: "Sufiyan (Super Admin)",
        email: "sufiyan@alraehospital.pk",
        role: "SUPER_ADMIN",
        passwordHash: hash,
        phone: "+92 300 0000000",
        isActive: true,
      },
    });
    console.log("Created user Sufiyan:", sufiyan.id);
  } else {
    sufiyan = await prisma.user.update({
      where: { id: sufiyan.id },
      data: {
        fullName: "Sufiyan (Super Admin)",
        email: "sufiyan@alraehospital.pk",
        role: "SUPER_ADMIN",
        passwordHash: hash,
        isActive: true,
      },
    });
    console.log("Updated user Sufiyan:", sufiyan.id);
  }

  const sufiyanId = sufiyan.id;

  // 4. Re-assign foreign key references to Sufiyan
  await prisma.auditLog.updateMany({
    where: { NOT: { userId: sufiyanId } },
    data: { userId: sufiyanId },
  });

  await prisma.inventoryMovement.updateMany({
    where: { NOT: { userId: sufiyanId } },
    data: { userId: sufiyanId },
  });

  await prisma.purchase.updateMany({
    where: { NOT: { createdById: sufiyanId } },
    data: { createdById: sufiyanId },
  });

  await prisma.prescription.updateMany({
    where: { verifiedById: { not: null }, NOT: { verifiedById: sufiyanId } },
    data: { verifiedById: sufiyanId },
  });

  await prisma.sale.updateMany({
    where: { NOT: { cashierId: sufiyanId } },
    data: { cashierId: sufiyanId },
  });

  await prisma.cashRegister.updateMany({
    where: { NOT: { cashierId: sufiyanId } },
    data: { cashierId: sufiyanId },
  });

  // 5. Delete user_permissions for other users
  await prisma.userPermission.deleteMany({
    where: { NOT: { userId: sufiyanId } },
  });

  // 6. Delete all other users
  const deleted = await prisma.user.deleteMany({
    where: { NOT: { id: sufiyanId } },
  });
  console.log(`Deleted ${deleted.count} other users.`);

  // Verify
  const allUsers = await prisma.user.findMany();
  console.log("Remaining users in database:", allUsers);
  const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
  console.log("Updated Pharmacy:", pharmacy?.name);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
