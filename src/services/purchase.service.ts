import prisma from "@/lib/prisma";
import { MovementType, PurchaseStatus, PaymentStatus, PaymentMethod, BatchStatus } from "@prisma/client";

export async function createPurchaseOrder(data: {
  pharmacyId: string;
  supplierId: string;
  supplierInvoiceNo?: string;
  notes?: string;
  userId: string;
  items: {
    medicineId: string;
    batchNumber: string;
    expiryDate: Date;
    manufacturingDate?: Date;
    quantity: number;
    bonusQuantity?: number;
    unitCost: number;
    tradePrice: number;
    retailPrice: number;
  }[];
}) {
  const count = await prisma.purchase.count({ where: { pharmacyId: data.pharmacyId } });
  const purchaseOrderNo = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  const totalCost = data.items.reduce(
    (sum, it) => sum + it.quantity * it.unitCost,
    0
  );

  return prisma.purchase.create({
    data: {
      pharmacyId: data.pharmacyId,
      purchaseOrderNo,
      supplierInvoiceNo: data.supplierInvoiceNo || null,
      supplierId: data.supplierId,
      totalCost,
      netAmount: totalCost,
      status: PurchaseStatus.ORDERED,
      paymentStatus: PaymentStatus.UNPAID,
      createdById: data.userId,
      notes: data.notes || null,
      items: {
        create: data.items.map((it) => ({
          medicineId: it.medicineId,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
          manufacturingDate: it.manufacturingDate || null,
          quantity: it.quantity,
          bonusQuantity: it.bonusQuantity || 0,
          unitCost: it.unitCost,
          tradePrice: it.tradePrice,
          retailPrice: it.retailPrice,
          totalAmount: it.quantity * it.unitCost,
        })),
      },
    },
    include: {
      items: { include: { medicine: true } },
      supplier: true,
    },
  });
}

/**
 * Goods Received Note (GRN) Execution
 * Receiving a purchase order atomically creates/increments medicine batches and updates stock
 */
export async function receivePurchaseGoods(purchaseId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: { include: { medicine: true } }, supplier: true },
    });

    if (!purchase) throw new Error("Purchase order not found");
    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new Error("Goods have already been received for this order.");
    }

    // Process each item into inventory
    for (const item of purchase.items) {
      const totalUnits = item.quantity + item.bonusQuantity;

      // Check if this batch already exists for this medicine
      let batch = await tx.medicineBatch.findFirst({
        where: {
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
        },
      });

      if (batch) {
        // Increment existing batch
        const newQty = batch.quantity + totalUnits;
        batch = await tx.medicineBatch.update({
          where: { id: batch.id },
          data: {
            quantity: newQty,
            purchaseCost: item.unitCost,
            tradePrice: item.tradePrice,
            retailPrice: item.retailPrice,
            status: newQty <= item.medicine.minStockLevel ? BatchStatus.LOW_STOCK : BatchStatus.ACTIVE,
          },
        });
      } else {
        // Create new batch
        batch = await tx.medicineBatch.create({
          data: {
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            manufacturingDate: item.manufacturingDate,
            purchaseCost: item.unitCost,
            tradePrice: item.tradePrice,
            retailPrice: item.retailPrice,
            quantity: totalUnits,
            status: totalUnits <= item.medicine.minStockLevel ? BatchStatus.LOW_STOCK : BatchStatus.ACTIVE,
          },
        });
      }

      // Link batch to purchase item
      await tx.purchaseItem.update({
        where: { id: item.id },
        data: { batchId: batch.id },
      });

      // Immutable stock movement
      await tx.inventoryMovement.create({
        data: {
          batchId: batch.id,
          type: MovementType.PURCHASE_RECEIPT,
          quantityDelta: totalUnits,
          balanceAfter: batch.quantity,
          unitCost: item.unitCost,
          referenceId: purchase.purchaseOrderNo,
          notes: `Goods received via PO ${purchase.purchaseOrderNo} (Supplier: ${purchase.supplier.name})`,
          userId,
        },
      });
    }

    // Update Purchase status
    const updatedPurchase = await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status: PurchaseStatus.RECEIVED,
        receivedAt: new Date(),
      },
    });

    // Update Supplier Balance (accounts payable increases by netAmount)
    await tx.supplier.update({
      where: { id: purchase.supplierId },
      data: {
        balance: { increment: purchase.netAmount },
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        pharmacyId: purchase.pharmacyId,
        userId,
        action: "GOODS_RECEIVED",
        entityType: "Purchase",
        entityId: purchase.id,
        details: `Received inventory for PO ${purchase.purchaseOrderNo}. Value: PKR ${Number(purchase.netAmount).toFixed(2)}`,
      },
    });

    return updatedPurchase;
  });
}
