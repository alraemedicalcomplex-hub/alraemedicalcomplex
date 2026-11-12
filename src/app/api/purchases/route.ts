import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createPurchaseOrder } from "@/services/purchase.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const purchases = await prisma.purchase.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
        createdBy: { select: { fullName: true } },
        items: { include: { medicine: true } },
        payments: true,
      },
    });

    return NextResponse.json({ purchases });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { supplierId, supplierInvoiceNo, notes, items } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json({ error: "Supplier and items are required" }, { status: 400 });
    }

    const purchase = await createPurchaseOrder({
      pharmacyId: user.pharmacyId,
      supplierId,
      supplierInvoiceNo,
      notes,
      userId: user.userId,
      items: items.map((it: any) => ({
        medicineId: it.medicineId,
        batchNumber: it.batchNumber,
        expiryDate: new Date(it.expiryDate),
        manufacturingDate: it.manufacturingDate ? new Date(it.manufacturingDate) : undefined,
        quantity: parseInt(it.quantity, 10),
        bonusQuantity: parseInt(it.bonusQuantity || "0", 10),
        unitCost: parseFloat(it.unitCost),
        tradePrice: parseFloat(it.tradePrice),
        retailPrice: parseFloat(it.retailPrice),
      })),
    });

    return NextResponse.json({ success: true, purchase });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
