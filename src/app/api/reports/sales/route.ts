import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const sales = await prisma.sale.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        cashier: { select: { fullName: true } },
        items: { include: { medicine: { select: { name: true } } } },
      },
    });

    if (format === "csv") {
      let csv = "Invoice Number,Date,Customer,Cashier,Subtotal (PKR),Discount (PKR),Total (PKR),Payment Status\n";
      sales.forEach((s) => {
        csv += `"${s.invoiceNumber}","${s.createdAt.toISOString()}","${s.customer?.name || "Walk-in"}","${s.cashier.fullName}",${s.subtotal},${s.discountAmount},${s.totalAmount},"${s.paymentStatus}"\n`;
      });

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="Sales_Report_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ sales });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
