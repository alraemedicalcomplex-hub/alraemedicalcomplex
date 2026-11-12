import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const [categories, manufacturers] = await Promise.all([
      prisma.category.findMany({
        where: { pharmacyId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.manufacturer.findMany({
        where: { pharmacyId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({ categories, manufacturers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
