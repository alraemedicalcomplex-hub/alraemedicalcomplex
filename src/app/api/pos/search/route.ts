import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const barcode = (searchParams.get("barcode") || "").trim();

    const now = new Date();

    const where: any = {
      pharmacyId,
      isActive: true,
    };

    if (barcode) {
      where.barcode = barcode;
    } else if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      take: 20,
      include: {
        category: { select: { name: true } },
        manufacturer: { select: { name: true } },
        batches: {
          where: {
            status: { in: ["ACTIVE", "LOW_STOCK"] },
            quantity: { gt: 0 },
            expiryDate: { gt: now }, // Never include expired batches in POS!
          },
          orderBy: { expiryDate: "asc" }, // FEFO order
          select: {
            id: true,
            batchNumber: true,
            expiryDate: true,
            purchaseCost: true,
            tradePrice: true,
            retailPrice: true,
            quantity: true,
          },
        },
      },
    });

    const results = medicines.map((med) => {
      const availableStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      const primaryBatch = med.batches.length > 0 ? med.batches[0] : null;

      return {
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        strength: med.strength,
        dosageForm: med.dosageForm,
        unitOfMeasure: med.unitOfMeasure,
        barcode: med.barcode,
        sku: med.sku,
        prescriptionRequired: med.prescriptionRequired,
        availableStock,
        unitPrice: primaryBatch ? Number(primaryBatch.retailPrice) : 0,
        tradePrice: primaryBatch ? Number(primaryBatch.tradePrice) : 0,
        purchaseCost: primaryBatch ? Number(primaryBatch.purchaseCost) : 0,
        batchNumber: primaryBatch?.batchNumber || null,
        expiryDate: primaryBatch?.expiryDate ? primaryBatch.expiryDate.toISOString() : null,
      };
    });

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
