import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createBatch } from "@/services/inventory.service";
import { batchSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const { searchParams } = new URL(req.url);
    const medicineId = searchParams.get("medicineId") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {
      medicine: { pharmacyId },
    };

    if (medicineId) {
      where.medicineId = medicineId;
    }

    if (status) {
      where.status = status;
    }

    const batches = await prisma.medicineBatch.findMany({
      where,
      orderBy: { expiryDate: "asc" }, // FEFO order
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            genericName: true,
            strength: true,
            dosageForm: true,
            unitOfMeasure: true,
            category: { select: { name: true } },
            manufacturer: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ batches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = batchSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { medicineId, batchNumber, manufacturingDate, expiryDate, purchaseCost, tradePrice, retailPrice, quantity } = validated.data;

    const batch = await createBatch({
      medicineId,
      batchNumber,
      manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
      expiryDate: new Date(expiryDate),
      purchaseCost,
      tradePrice,
      retailPrice,
      quantity,
      userId: user.userId,
    });

    return NextResponse.json({ success: true, batch });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
