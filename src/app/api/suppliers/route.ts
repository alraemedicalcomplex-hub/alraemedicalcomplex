import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { supplierSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const suppliers = await prisma.supplier.findMany({
      where: { pharmacyId },
      orderBy: { name: "asc" },
      include: {
        purchases: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { purchaseOrderNo: true, netAmount: true, status: true, createdAt: true },
        },
        payments: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ suppliers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = supplierSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        pharmacyId: user.pharmacyId,
        ...validated.data,
        balance: validated.data.openingBalance,
      },
    });

    return NextResponse.json({ success: true, supplier });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
