import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { expenseSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = expenseSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        pharmacyId: user.pharmacyId,
        title: validated.data.title,
        category: validated.data.category,
        amount: validated.data.amount,
        paymentMethod: validated.data.paymentMethod,
        paidTo: validated.data.paidTo || null,
        date: validated.data.date ? new Date(validated.data.date) : new Date(),
        notes: validated.data.notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        pharmacyId: user.pharmacyId,
        userId: user.userId,
        action: "EXPENSE_RECORDED",
        entityType: "Expense",
        entityId: expense.id,
        details: `Recorded expense "${expense.title}" for PKR ${Number(expense.amount).toFixed(2)} (${expense.category})`,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
