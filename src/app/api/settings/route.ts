import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: { settings: true },
    });

    return NextResponse.json({ pharmacy });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      name,
      legalName,
      dslNumber,
      ntnNumber,
      strnNumber,
      phone,
      email,
      address,
      city,
      lowStockThreshold,
      expiryAlertDays,
      thermalPrinterWidth,
      receiptFooterMessage,
    } = await req.json();

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.pharmacy.update({
        where: { id: user.pharmacyId },
        data: {
          name,
          legalName,
          dslNumber,
          ntnNumber,
          strnNumber,
          phone,
          email,
          address,
          city,
        },
      });

      const s = await tx.pharmacySettings.upsert({
        where: { pharmacyId: user.pharmacyId },
        update: {
          lowStockThreshold: parseInt(lowStockThreshold, 10) || 15,
          expiryAlertDays: parseInt(expiryAlertDays, 10) || 90,
          thermalPrinterWidth: thermalPrinterWidth || "80mm",
          receiptFooterMessage: receiptFooterMessage || "",
        },
        create: {
          pharmacyId: user.pharmacyId,
          lowStockThreshold: parseInt(lowStockThreshold, 10) || 15,
          expiryAlertDays: parseInt(expiryAlertDays, 10) || 90,
          thermalPrinterWidth: thermalPrinterWidth || "80mm",
          receiptFooterMessage: receiptFooterMessage || "",
        },
      });

      await tx.auditLog.create({
        data: {
          pharmacyId: user.pharmacyId,
          userId: user.userId,
          action: "SETTINGS_UPDATED",
          entityType: "PharmacySettings",
          details: `Updated pharmacy settings for ${name}`,
        },
      });

      return { ...p, settings: s };
    });

    return NextResponse.json({ success: true, pharmacy: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
