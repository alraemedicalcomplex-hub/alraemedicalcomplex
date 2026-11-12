import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { executeSaleCheckout } from "@/services/pos.service";
import { checkoutSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const body = await req.json();
    const validated = checkoutSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid checkout request", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sale = await executeSaleCheckout(
      user.pharmacyId,
      user.userId,
      validated.data as any
    );

    return NextResponse.json({
      success: true,
      sale,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
