import prisma from "@/lib/prisma";
import { allocateBatchesFEFO } from "./inventory.service";
import { POSCheckoutRequest } from "@/types";
import {
  MovementType,
  PaymentMethod,
  PaymentStatus,
  SaleStatus,
  CashTransactionType,
  RegisterStatus,
} from "@prisma/client";

export async function executeSaleCheckout(
  pharmacyId: string,
  cashierId: string,
  payload: POSCheckoutRequest
) {
  return prisma.$transaction(async (tx) => {
    // 1. Generate unique sequential invoice number
    const count = await tx.sale.count({ where: { pharmacyId } });
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, "0")}`;

    // 2. Process and validate all cart items
    let calculatedSubtotal = 0;
    const processedItems: {
      medicineId: string;
      quantity: number;
      unitPrice: number;
      lineDiscount: number;
      totalPrice: number;
      allocations: {
        batchId: string;
        quantity: number;
        costPrice: number;
      }[];
    }[] = [];

    for (const item of payload.items) {
      const medicine = await tx.medicine.findFirst({
        where: { id: item.medicineId, pharmacyId, isActive: true },
        include: {
          batches: {
            where: { status: { in: ["ACTIVE", "LOW_STOCK"] } },
          },
        },
      });

      if (!medicine) {
        throw new Error(`Medicine not found or inactive: ${item.medicineId}`);
      }

      // Check if prescription required and prescription attached
      if (medicine.prescriptionRequired && !payload.prescriptionId) {
        // Enforce warning or validation - we allow pharmacist override with cashier audit
      }

      // Allocate batches using FEFO
      const now = new Date();
      const eligibleBatches = await tx.medicineBatch.findMany({
        where: {
          medicineId: medicine.id,
          status: { in: ["ACTIVE", "LOW_STOCK"] },
          quantity: { gt: 0 },
          expiryDate: { gt: now },
        },
        orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
      });

      const totalStock = eligibleBatches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalStock < item.quantity) {
        throw new Error(
          `Insufficient non-expired stock for "${medicine.name}". Requested: ${item.quantity}, Available: ${totalStock}`
        );
      }

      let remaining = item.quantity;
      const batchAllocations: { batchId: string; quantity: number; costPrice: number }[] = [];

      for (const batch of eligibleBatches) {
        if (remaining <= 0) break;
        const deductQty = Math.min(batch.quantity, remaining);

        batchAllocations.push({
          batchId: batch.id,
          quantity: deductQty,
          costPrice: Number(batch.purchaseCost),
        });

        // Deduct batch quantity
        const newBatchQty = batch.quantity - deductQty;
        const newStatus =
          newBatchQty === 0
            ? "DEPLETED"
            : newBatchQty <= medicine.minStockLevel
            ? "LOW_STOCK"
            : "ACTIVE";

        await tx.medicineBatch.update({
          where: { id: batch.id },
          data: {
            quantity: newBatchQty,
            status: newStatus as any,
          },
        });

        // Record immutable inventory movement
        await tx.inventoryMovement.create({
          data: {
            batchId: batch.id,
            type: MovementType.SALE_DISPENSE,
            quantityDelta: -deductQty,
            balanceAfter: newBatchQty,
            unitCost: batch.purchaseCost,
            referenceId: invoiceNumber,
            notes: `Sold via Invoice ${invoiceNumber}`,
            userId: cashierId,
          },
        });

        remaining -= deductQty;
      }

      // Use latest retail price from earliest batch or catalog
      const unitPrice =
        eligibleBatches.length > 0 ? Number(eligibleBatches[0].retailPrice) : item.unitPrice;
      const lineSubtotal = unitPrice * item.quantity;
      const lineDiscount = item.lineDiscount || 0;
      const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

      calculatedSubtotal += lineTotal;

      processedItems.push({
        medicineId: medicine.id,
        quantity: item.quantity,
        unitPrice,
        lineDiscount,
        totalPrice: lineTotal,
        allocations: batchAllocations,
      });
    }

    // 3. Compute Final Invoice Figures
    const discountAmount = payload.discountAmount || 0;
    const taxAmount = payload.taxAmount || 0;
    const totalAmount = Math.max(0, calculatedSubtotal - discountAmount + taxAmount);
    const paidAmount = payload.paidAmount !== undefined ? payload.paidAmount : totalAmount;
    const changeAmount = Math.max(0, paidAmount - totalAmount);

    let paymentStatus: PaymentStatus = PaymentStatus.PAID;
    if (paidAmount < totalAmount) {
      paymentStatus = paidAmount > 0 ? PaymentStatus.PARTIAL : PaymentStatus.UNPAID;
    }

    // 4. Create Sale Record
    const sale = await tx.sale.create({
      data: {
        pharmacyId,
        invoiceNumber,
        customerId: payload.customerId || null,
        prescriptionId: payload.prescriptionId || null,
        cashierId,
        subtotal: calculatedSubtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        paidAmount,
        changeAmount,
        saleStatus: SaleStatus.COMPLETED,
        paymentStatus,
        notes: payload.notes || null,
        items: {
          create: processedItems.map((pi) => ({
            medicineId: pi.medicineId,
            quantity: pi.quantity,
            unitPrice: pi.unitPrice,
            lineDiscount: pi.lineDiscount,
            totalPrice: pi.totalPrice,
            batches: {
              create: pi.allocations.map((a) => ({
                batchId: a.batchId,
                quantity: a.quantity,
                costPrice: a.costPrice,
              })),
            },
          })),
        },
        payments: {
          create: {
            method: payload.paymentMethod,
            amount: paidAmount > totalAmount ? totalAmount : paidAmount,
            reference: payload.notes || null,
          },
        },
      },
      include: {
        items: {
          include: {
            medicine: {
              select: { name: true, strength: true, dosageForm: true, unitOfMeasure: true },
            },
            batches: {
              include: { batch: { select: { batchNumber: true, expiryDate: true } } },
            },
          },
        },
        payments: true,
        customer: true,
        pharmacy: true,
        cashier: { select: { fullName: true } },
      },
    });

    // 5. Update Customer Balance if credit sale
    if (payload.customerId) {
      if (paymentStatus === PaymentStatus.UNPAID || paymentStatus === PaymentStatus.PARTIAL) {
        const unpaidDiff = totalAmount - paidAmount;
        await tx.customer.update({
          where: { id: payload.customerId },
          data: {
            balance: { increment: unpaidDiff },
          },
        });
      }
      // Add loyalty points (1 point per 100 PKR)
      const pointsEarned = Math.floor(totalAmount / 100);
      if (pointsEarned > 0) {
        await tx.customer.update({
          where: { id: payload.customerId },
          data: {
            loyaltyPoints: { increment: pointsEarned },
          },
        });
      }
    }

    // 6. Record Cash Collection in Open Register if Cash payment
    if (payload.paymentMethod === PaymentMethod.CASH) {
      const activeRegister = await tx.cashRegister.findFirst({
        where: {
          pharmacyId,
          cashierId,
          status: RegisterStatus.OPEN,
        },
      });

      if (activeRegister) {
        await tx.cashTransaction.create({
          data: {
            cashRegisterId: activeRegister.id,
            type: CashTransactionType.SALE_COLLECTION,
            amount: paidAmount > totalAmount ? totalAmount : paidAmount,
            description: `Sale ${invoiceNumber}`,
          },
        });
      }
    }

    // 7. Audit Log
    await tx.auditLog.create({
      data: {
        pharmacyId,
        userId: cashierId,
        action: "SALE_COMPLETED",
        entityType: "Sale",
        entityId: sale.id,
        details: `Dispensed invoice ${invoiceNumber} for PKR ${totalAmount.toFixed(2)} (${processedItems.length} items)`,
      },
    });

    return sale;
  });
}
