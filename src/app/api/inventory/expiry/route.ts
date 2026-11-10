import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getExpiryBuckets } from "@/services/inventory.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const buckets = await getExpiryBuckets(pharmacyId);
    return NextResponse.json(buckets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
