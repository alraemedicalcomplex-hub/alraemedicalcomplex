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

    const customers = await prisma.customer.findMany({
      where: {
        pharmacyId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ customers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, phone, address, creditLimit } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        pharmacyId: user.pharmacyId,
        name,
        phone,
        address: address || null,
        creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
