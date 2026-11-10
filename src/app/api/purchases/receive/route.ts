import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { receivePurchaseGoods } from "@/services/purchase.service";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { purchaseId } = await req.json();
    if (!purchaseId) {
      return NextResponse.json({ error: "Purchase ID is required" }, { status: 400 });
    }

    const updated = await receivePurchaseGoods(purchaseId, user.userId);
    return NextResponse.json({ success: true, purchase: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
