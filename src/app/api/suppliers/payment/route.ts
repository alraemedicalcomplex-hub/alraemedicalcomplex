import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PaymentMethod } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { supplierId, purchaseId, amount, method, reference, notes } = await req.json();

    const numericAmount = parseFloat(amount);
    if (!supplierId || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Valid supplier and payment amount required" }, { status: 400 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.supplierPayment.create({
        data: {
          supplierId,
          purchaseId: purchaseId || null,
          amount: numericAmount,
          method: method || PaymentMethod.BANK_TRANSFER,
          reference: reference || null,
          notes: notes || "Supplier payment voucher",
        },
      });

      // Deduct from supplier balance (accounts payable decreases)
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          balance: { decrement: numericAmount },
        },
      });

      return p;
    });

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
