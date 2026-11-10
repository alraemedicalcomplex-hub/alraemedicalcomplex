import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMedicines, createMedicine } from "@/services/medicine.service";
import { medicineSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const manufacturerId = searchParams.get("manufacturerId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await getMedicines({
      pharmacyId,
      query,
      categoryId,
      manufacturerId,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = medicineSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const medicine = await createMedicine(validated.data, user.pharmacyId, user.userId);
    return NextResponse.json({ success: true, medicine });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
