import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adjustStock, quarantineBatch } from "@/services/inventory.service";
import { MovementType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId, quantityDelta, type, reason, action } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    if (action === "QUARANTINE") {
      const updated = await quarantineBatch(batchId, reason || "Suspect / Recalled Batch", user.userId);
      return NextResponse.json({ success: true, batch: updated });
    }

    if (typeof quantityDelta !== "number" || quantityDelta === 0) {
      return NextResponse.json({ error: "Valid non-zero quantity delta required" }, { status: 400 });
    }

    const adjustmentType = Object.values(MovementType).includes(type)
      ? type
      : MovementType.ADJUSTMENT_AUDIT;

    const updated = await adjustStock({
      batchId,
      quantityDelta,
      type: adjustmentType,
      notes: reason || "Manual inventory adjustment",
      userId: user.userId,
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
