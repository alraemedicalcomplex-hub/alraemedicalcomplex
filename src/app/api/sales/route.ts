import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const where: any = { pharmacyId };
    if (q) {
      where.OR = [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { phone: { contains: q, mode: "insensitive" } } },
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: true,
        cashier: { select: { fullName: true } },
        items: {
          include: {
            medicine: { select: { name: true, strength: true, dosageForm: true } },
            batches: {
              include: { batch: { select: { batchNumber: true, expiryDate: true } } },
            },
          },
        },
        payments: true,
        returns: true,
      },
    });

    return NextResponse.json({ sales });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
