import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { customerId, amount, notes } = await req.json();
    const numericAmount = parseFloat(amount);

    if (!customerId || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Valid customer and payment amount required" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: { decrement: numericAmount },
        },
      });

      await tx.auditLog.create({
        data: {
          pharmacyId: user.pharmacyId,
          userId: user.userId,
          action: "CUSTOMER_PAYMENT_RECEIVED",
          entityType: "Customer",
          entityId: customerId,
          details: `Received PKR ${numericAmount.toFixed(2)} from ${customer.name}. New Balance: PKR ${Number(customer.balance).toFixed(2)} (${notes || "Credit settlement"})`,
        },
      });

      return customer;
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
