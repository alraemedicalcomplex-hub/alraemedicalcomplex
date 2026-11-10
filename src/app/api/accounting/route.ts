import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [sales, purchases, expenses, registers] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          pharmacyId,
          createdAt: { gte: monthStart, lte: monthEnd },
          saleStatus: { not: "CANCELLED" },
        },
        _sum: { totalAmount: true },
      }),
      prisma.purchase.aggregate({
        where: {
          pharmacyId,
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ["RECEIVED", "ORDERED", "PARTIAL"] },
        },
        _sum: { netAmount: true },
      }),
      prisma.expense.aggregate({
        where: {
          pharmacyId,
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.cashRegister.findMany({
        where: { pharmacyId },
        orderBy: { openedAt: "desc" },
        take: 10,
        include: {
          cashier: { select: { fullName: true } },
          transactions: { orderBy: { createdAt: "desc" } },
        },
      }),
    ]);

    const totalSales = Number(sales._sum.totalAmount || 0);
    const totalPurchases = Number(purchases._sum.netAmount || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);

    // Approximate Gross Profit (average margin 18% in Pakistani retail pharma trade)
    const estimatedCOGS = totalSales * 0.82;
    const grossProfit = totalSales - estimatedCOGS;
    const netProfit = grossProfit - totalExpenses;

    const recentExpenses = await prisma.expense.findMany({
      where: { pharmacyId },
      orderBy: { date: "desc" },
      take: 20,
    });

    return NextResponse.json({
      summary: {
        totalSales,
        totalPurchases,
        totalExpenses,
        estimatedCOGS,
        grossProfit,
        netProfit,
      },
      registers,
      recentExpenses,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
