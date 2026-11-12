import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PrescriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const prescriptions = await prisma.prescription.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: true,
        verifiedBy: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ prescriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      patientName,
      patientAge,
      patientGender,
      doctorName,
      pmdcNumber,
      clinicHospital,
      customerId,
      notes,
      items,
    } = body;

    if (!patientName || !doctorName || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Patient name, doctor name, and prescribed medicines are required." },
        { status: 400 }
      );
    }

    const prescription = await prisma.prescription.create({
      data: {
        pharmacyId: user.pharmacyId,
        patientName,
        patientAge: patientAge ? parseInt(patientAge, 10) : null,
        patientGender,
        doctorName,
        pmdcNumber,
        clinicHospital,
        customerId: customerId || null,
        notes,
        status: PrescriptionStatus.PENDING,
        items: {
          create: items.map((it: any) => ({
            medicineName: it.medicineName,
            dosage: it.dosage || null,
            frequency: it.frequency || null,
            durationDays: it.durationDays ? parseInt(it.durationDays, 10) : null,
            quantityPrescribed: parseInt(it.quantityPrescribed, 10) || 1,
            quantityDispensed: 0,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, prescription });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prescriptionId, status } = await req.json();
    if (!prescriptionId || !status) {
      return NextResponse.json({ error: "Missing ID or status" }, { status: 400 });
    }

    const updated = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: status as PrescriptionStatus,
        verifiedById: user.userId,
        verifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        pharmacyId: user.pharmacyId,
        userId: user.userId,
        action: "PRESCRIPTION_VERIFIED",
        entityType: "Prescription",
        entityId: prescriptionId,
        details: `Pharmacist ${user.fullName} updated prescription status to ${status}`,
      },
    });

    return NextResponse.json({ success: true, prescription: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
