import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { MovementType, SaleStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { saleId, reason, items, refundAmount } = await req.json();

    if (!saleId || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid return request payload" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: { include: { batches: true } } },
      });

      if (!sale) throw new Error("Sale invoice not found");

      const count = await tx.saleReturn.count();
      const returnNo = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

      const saleReturn = await tx.saleReturn.create({
        data: {
          saleId,
          returnNo,
          reason: reason || "Customer Return",
          refundAmount: refundAmount || 0,
          items: {
            create: items.map((it: any) => ({
              saleItemId: it.saleItemId,
              quantity: it.quantity,
              disposition: it.disposition || "RESTOCK",
              refundAmount: it.refundAmount || 0,
            })),
          },
        },
      });

      // Handle stock disposition
      for (const it of items) {
        if (it.disposition === "RESTOCK") {
          // Find original batch allocated to restock
          const saleItem = sale.items.find((si) => si.id === it.saleItemId);
          if (saleItem && saleItem.batches.length > 0) {
            const batchId = saleItem.batches[0].batchId;
            const batch = await tx.medicineBatch.findUnique({ where: { id: batchId } });
            if (batch) {
              const newQty = batch.quantity + it.quantity;
              await tx.medicineBatch.update({
                where: { id: batchId },
                data: { quantity: newQty },
              });

              await tx.inventoryMovement.create({
                data: {
                  batchId,
                  type: MovementType.SALE_RETURN,
                  quantityDelta: it.quantity,
                  balanceAfter: newQty,
                  unitCost: batch.purchaseCost,
                  referenceId: returnNo,
                  notes: `Restocked via Sales Return ${returnNo} (Reason: ${reason})`,
                  userId: user.userId,
                },
              });
            }
          }
        }
      }

      // Update sale status
      await tx.sale.update({
        where: { id: saleId },
        data: { saleStatus: SaleStatus.PARTIALLY_RETURNED },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          pharmacyId: user.pharmacyId,
          userId: user.userId,
          action: "SALE_RETURN_PROCESSED",
          entityType: "SaleReturn",
          entityId: saleReturn.id,
          details: `Processed return ${returnNo} for invoice ${sale.invoiceNumber}. Refund: PKR ${refundAmount}`,
        },
      });

      return saleReturn;
    });

    return NextResponse.json({ success: true, return: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const returns = await prisma.saleReturn.findMany({
      where: {
        sale: {
          pharmacyId: user.pharmacyId,
        },
        ...(q
          ? {
              OR: [
                { returnNo: { contains: q, mode: "insensitive" } },
                { reason: { contains: q, mode: "insensitive" } },
                {
                  sale: {
                    OR: [
                      { invoiceNumber: { contains: q, mode: "insensitive" } },
                      { customer: { name: { contains: q, mode: "insensitive" } } },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        sale: {
          include: {
            customer: true,
            cashier: { select: { fullName: true } },
          },
        },
        items: {
          include: {
            saleItem: {
              include: {
                medicine: { select: { name: true, strength: true, dosageForm: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ returns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
