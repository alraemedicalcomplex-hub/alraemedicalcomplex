import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // If Vercel Blob token is connected (automatic in production on Vercel)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`prescriptions/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      return NextResponse.json({ success: true, url: blob.url });
    }

    // Fallback URL for local testing
    return NextResponse.json({
      success: true,
      url: `/uploads/${file.name}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
