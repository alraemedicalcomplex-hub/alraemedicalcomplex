import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const staff = await prisma.user.findMany({
      where: { pharmacyId },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ staff });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Only administrators can create staff accounts." }, { status: 403 });
    }

    const { fullName, email, password, phone, role } = await req.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: "Full name, email, password, and role are required." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const created = await prisma.user.create({
      data: {
        pharmacyId: user.pharmacyId,
        fullName,
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone || null,
        role: role as UserRole,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        pharmacyId: user.pharmacyId,
        userId: user.userId,
        action: "STAFF_CREATED",
        entityType: "User",
        entityId: created.id,
        details: `Administrator created user ${fullName} (${role})`,
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: created.id, fullName: created.fullName, email: created.email, role: created.role },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { staffId, isActive } = await req.json();

    const updated = await prisma.user.update({
      where: { id: staffId },
      data: { isActive },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
