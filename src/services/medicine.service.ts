import prisma from "@/lib/prisma";
import { DosageForm, StorageCondition } from "@prisma/client";

export interface MedicineFilterOptions {
  pharmacyId: string;
  query?: string;
  categoryId?: string;
  manufacturerId?: string;
  prescriptionRequired?: boolean;
  page?: number;
  limit?: number;
}

export async function getMedicines(options: MedicineFilterOptions) {
  const {
    pharmacyId,
    query,
    categoryId,
    manufacturerId,
    prescriptionRequired,
    page = 1,
    limit = 50,
  } = options;

  const where: any = {
    pharmacyId,
    isActive: true,
  };

  if (query && query.trim()) {
    const q = query.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { genericName: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (manufacturerId) {
    where.manufacturerId = manufacturerId;
  }

  if (typeof prescriptionRequired === "boolean") {
    where.prescriptionRequired = prescriptionRequired;
  }

  const skip = (page - 1) * limit;

  const [total, medicines] = await Promise.all([
    prisma.medicine.count({ where }),
    prisma.medicine.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true } },
        manufacturer: { select: { id: true, name: true } },
        batches: {
          where: { status: { in: ["ACTIVE", "LOW_STOCK"] } },
          orderBy: { expiryDate: "asc" }, // FEFO order
          select: {
            id: true,
            batchNumber: true,
            expiryDate: true,
            quantity: true,
            purchaseCost: true,
            tradePrice: true,
            retailPrice: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const items = medicines.map((m) => {
    const totalStock = m.batches.reduce((sum, b) => sum + b.quantity, 0);
    const earliestExpiry = m.batches.length > 0 ? m.batches[0].expiryDate : null;
    const lowestRetailPrice =
      m.batches.length > 0
        ? Math.min(...m.batches.map((b) => Number(b.retailPrice)))
        : 0;

    return {
      ...m,
      totalStock,
      earliestExpiry,
      currentPrice: lowestRetailPrice,
      isLowStock: totalStock <= m.minStockLevel,
      isOutOfStock: totalStock === 0,
    };
  });

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMedicineById(id: string, pharmacyId: string) {
  return prisma.medicine.findFirst({
    where: { id, pharmacyId },
    include: {
      category: true,
      manufacturer: true,
      batches: {
        orderBy: { expiryDate: "asc" },
        include: {
          movements: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { user: { select: { fullName: true } } },
          },
        },
      },
    },
  });
}

export async function createMedicine(data: any, pharmacyId: string, userId: string) {
  // Duplicate check on barcode & sku within pharmacy
  if (data.barcode) {
    const existing = await prisma.medicine.findFirst({
      where: { pharmacyId, barcode: data.barcode },
    });
    if (existing) {
      throw new Error(`Medicine with barcode ${data.barcode} already exists (${existing.name}).`);
    }
  }

  const medicine = await prisma.medicine.create({
    data: {
      ...data,
      pharmacyId,
    },
  });

  await prisma.auditLog.create({
    data: {
      pharmacyId,
      userId,
      action: "MEDICINE_CREATED",
      entityType: "Medicine",
      entityId: medicine.id,
      details: `Created medicine ${medicine.name} (${medicine.genericName})`,
    },
  });

  return medicine;
}

export async function updateMedicine(
  id: string,
  data: any,
  pharmacyId: string,
  userId: string
) {
  const medicine = await prisma.medicine.update({
    where: { id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      pharmacyId,
      userId,
      action: "MEDICINE_UPDATED",
      entityType: "Medicine",
      entityId: medicine.id,
      details: `Updated medicine master record: ${medicine.name}`,
    },
  });

  return medicine;
}

export async function archiveMedicine(id: string, pharmacyId: string, userId: string) {
  const medicine = await prisma.medicine.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      pharmacyId,
      userId,
      action: "MEDICINE_ARCHIVED",
      entityType: "Medicine",
      entityId: id,
      details: `Archived medicine ${medicine.name}`,
    },
  });

  return medicine;
}
