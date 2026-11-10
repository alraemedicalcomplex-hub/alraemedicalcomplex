import prisma from "@/lib/prisma";
import { BatchStatus, MovementType } from "@prisma/client";

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  allocatedQuantity: number;
  costPrice: number;
  retailPrice: number;
}

/**
 * FEFO (First-Expiry-First-Out) Batch Allocation Strategy
 * Strictly allocates stock from earliest expiring active batches.
 * Rejects expired (expiryDate <= now) or quarantined stock.
 */
export async function allocateBatchesFEFO(
  medicineId: string,
  requestedQuantity: number
): Promise<BatchAllocation[]> {
  const now = new Date();

  // Query active batches with available quantity, strictly non-expired, ordered by expiry date ASC
  const eligibleBatches = await prisma.medicineBatch.findMany({
    where: {
      medicineId,
      status: { in: [BatchStatus.ACTIVE, BatchStatus.LOW_STOCK] },
      quantity: { gt: 0 },
      expiryDate: { gt: now },
    },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
  });

  const totalAvailable = eligibleBatches.reduce((sum, b) => sum + b.quantity, 0);
  if (totalAvailable < requestedQuantity) {
    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
      select: { name: true },
    });
    throw new Error(
      `Insufficient sellable non-expired stock for "${medicine?.name || medicineId}". Requested: ${requestedQuantity}, Available: ${totalAvailable}`
    );
  }

  let remaining = requestedQuantity;
  const allocations: BatchAllocation[] = [];

  for (const batch of eligibleBatches) {
    if (remaining <= 0) break;

    const alloc = Math.min(batch.quantity, remaining);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      allocatedQuantity: alloc,
      costPrice: Number(batch.purchaseCost),
      retailPrice: Number(batch.retailPrice),
    });

    remaining -= alloc;
  }

  return allocations;
}

export async function createBatch(data: {
  medicineId: string;
  batchNumber: string;
  manufacturingDate?: Date;
  expiryDate: Date;
  purchaseCost: number;
  tradePrice: number;
  retailPrice: number;
  quantity: number;
  userId: string;
}) {
  const now = new Date();
  if (data.expiryDate <= now) {
    throw new Error("Cannot create a batch that is already expired.");
  }

  return prisma.$transaction(async (tx) => {
    const batch = await tx.medicineBatch.create({
      data: {
        medicineId: data.medicineId,
        batchNumber: data.batchNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
        purchaseCost: data.purchaseCost,
        tradePrice: data.tradePrice,
        retailPrice: data.retailPrice,
        quantity: data.quantity,
        status: data.quantity <= 15 ? BatchStatus.LOW_STOCK : BatchStatus.ACTIVE,
      },
    });

    if (data.quantity > 0) {
      await tx.inventoryMovement.create({
        data: {
          batchId: batch.id,
          type: MovementType.OPENING_STOCK,
          quantityDelta: data.quantity,
          balanceAfter: data.quantity,
          unitCost: data.purchaseCost,
          notes: "Initial batch intake / opening stock",
          userId: data.userId,
        },
      });
    }

    return batch;
  });
}

export async function adjustStock(data: {
  batchId: string;
  quantityDelta: number; // positive or negative
  type: MovementType;
  notes: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.medicineBatch.findUnique({
      where: { id: data.batchId },
      include: { medicine: true },
    });

    if (!batch) {
      throw new Error("Batch not found.");
    }

    const newQuantity = batch.quantity + data.quantityDelta;
    if (newQuantity < 0) {
      throw new Error(
        `Negative inventory prohibited. Current stock: ${batch.quantity}, Adjustment: ${data.quantityDelta}`
      );
    }

    let status = batch.status;
    if (newQuantity === 0) {
      status = BatchStatus.DEPLETED;
    } else if (newQuantity <= batch.medicine.minStockLevel) {
      status = BatchStatus.LOW_STOCK;
    } else if (batch.status === BatchStatus.LOW_STOCK || batch.status === BatchStatus.DEPLETED) {
      status = BatchStatus.ACTIVE;
    }

    const updated = await tx.medicineBatch.update({
      where: { id: data.batchId },
      data: {
        quantity: newQuantity,
        status,
      },
    });

    await tx.inventoryMovement.create({
      data: {
        batchId: data.batchId,
        type: data.type,
        quantityDelta: data.quantityDelta,
        balanceAfter: newQuantity,
        unitCost: batch.purchaseCost,
        notes: data.notes,
        userId: data.userId,
      },
    });

    return updated;
  });
}

export async function quarantineBatch(batchId: string, reason: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.medicineBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found.");

    const updated = await tx.medicineBatch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.QUARANTINED,
        quarantineReason: reason,
      },
    });

    await tx.inventoryMovement.create({
      data: {
        batchId,
        type: MovementType.QUARANTINE,
        quantityDelta: 0,
        balanceAfter: batch.quantity,
        notes: `Quarantined: ${reason}`,
        userId,
      },
    });

    return updated;
  });
}

export async function getExpiryBuckets(pharmacyId: string) {
  const now = new Date();
  const d30 = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const d60 = new Date(Date.now() + 60 * 24 * 3600 * 1000);
  const d90 = new Date(Date.now() + 90 * 24 * 3600 * 1000);

  const batches = await prisma.medicineBatch.findMany({
    where: {
      medicine: { pharmacyId },
      quantity: { gt: 0 },
    },
    include: {
      medicine: {
        select: {
          id: true,
          name: true,
          genericName: true,
          unitOfMeasure: true,
          manufacturer: { select: { name: true } },
        },
      },
    },
    orderBy: { expiryDate: "asc" },
  });

  const expired: typeof batches = [];
  const within30: typeof batches = [];
  const within60: typeof batches = [];
  const within90: typeof batches = [];
  const quarantined: typeof batches = [];

  for (const b of batches) {
    if (b.status === BatchStatus.QUARANTINED) {
      quarantined.push(b);
    } else if (b.expiryDate <= now) {
      expired.push(b);
    } else if (b.expiryDate <= d30) {
      within30.push(b);
    } else if (b.expiryDate <= d60) {
      within60.push(b);
    } else if (b.expiryDate <= d90) {
      within90.push(b);
    }
  }

  return {
    expired,
    within30,
    within60,
    within90,
    quarantined,
    summary: {
      expiredCount: expired.length,
      within30Count: within30.length,
      within60Count: within60.length,
      within90Count: within90.length,
      quarantinedCount: quarantined.length,
    },
  };
}
