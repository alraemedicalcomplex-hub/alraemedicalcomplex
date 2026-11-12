import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { DosageForm } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { csvData } = await req.json();
    if (!csvData || typeof csvData !== "string") {
      return NextResponse.json({ error: "Missing or invalid CSV data" }, { status: 400 });
    }

    const lines = csvData.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must include a header and at least one row." }, { status: 400 });
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = header.indexOf("name");
    const genericIdx = header.indexOf("genericname");
    const categoryIdx = header.indexOf("category");
    const manufacturerIdx = header.indexOf("manufacturer");
    const strengthIdx = header.indexOf("strength");
    const dosageIdx = header.indexOf("dosageform");
    const barcodeIdx = header.indexOf("barcode");

    if (nameIdx === -1 || genericIdx === -1 || categoryIdx === -1) {
      return NextResponse.json(
        { error: "CSV must contain at least 'name', 'genericName', and 'category' columns." },
        { status: 400 }
      );
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const name = cols[nameIdx];
      const genericName = cols[genericIdx];
      const catName = cols[categoryIdx] || "General";
      const mfgName = manufacturerIdx !== -1 ? cols[manufacturerIdx] || "Local Pharma" : "Local Pharma";
      const strength = strengthIdx !== -1 ? cols[strengthIdx] || "Standard" : "Standard";
      const dosage = (dosageIdx !== -1 ? cols[dosageIdx]?.toUpperCase() : "TABLET") as DosageForm;
      const barcode = barcodeIdx !== -1 ? cols[barcodeIdx] : undefined;

      if (!name || !genericName) {
        errors.push(`Row ${i}: Missing name or generic formula`);
        continue;
      }

      // Find or create Category
      let category = await prisma.category.findFirst({
        where: { pharmacyId: user.pharmacyId, name: catName },
      });
      if (!category) {
        category = await prisma.category.create({
          data: { pharmacyId: user.pharmacyId, name: catName },
        });
      }

      // Find or create Manufacturer
      let manufacturer = await prisma.manufacturer.findFirst({
        where: { pharmacyId: user.pharmacyId, name: mfgName },
      });
      if (!manufacturer) {
        manufacturer = await prisma.manufacturer.create({
          data: { pharmacyId: user.pharmacyId, name: mfgName },
        });
      }

      // Check duplicate
      const existing = await prisma.medicine.findFirst({
        where: {
          pharmacyId: user.pharmacyId,
          OR: [
            ...(barcode ? [{ barcode }] : []),
            { name, strength },
          ],
        },
      });

      if (existing) {
        errors.push(`Row ${i}: Skipped duplicate '${name} ${strength}'`);
        continue;
      }

      await prisma.medicine.create({
        data: {
          pharmacyId: user.pharmacyId,
          name,
          genericName,
          categoryId: category.id,
          manufacturerId: manufacturer.id,
          dosageForm: Object.values(DosageForm).includes(dosage) ? dosage : DosageForm.TABLET,
          strength,
          barcode: barcode || null,
        },
      });

      importedCount++;
    }

    await prisma.auditLog.create({
      data: {
        pharmacyId: user.pharmacyId,
        userId: user.userId,
        action: "BULK_CSV_IMPORT",
        entityType: "Medicine",
        details: `Imported ${importedCount} medicines via CSV bulk import`,
      },
    });

    return NextResponse.json({
      success: true,
      importedCount,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
