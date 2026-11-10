import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const pharmacyId = user?.pharmacyId || "00000000-0000-0000-0000-000000000001";

    const medicines = await prisma.medicine.findMany({
      where: { pharmacyId, isActive: true },
      include: {
        category: true,
        manufacturer: true,
        batches: {
          where: { status: { in: ["ACTIVE", "LOW_STOCK"] } },
        },
      },
      orderBy: { name: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sufi Pharmacy Management System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Medicine Catalog");

    // Define columns
    sheet.columns = [
      { header: "Medicine Name", key: "name", width: 28 },
      { header: "Generic Formula", key: "genericName", width: 32 },
      { header: "Category", key: "category", width: 22 },
      { header: "Manufacturer", key: "manufacturer", width: 25 },
      { header: "Dosage Form", key: "dosageForm", width: 14 },
      { header: "Strength", key: "strength", width: 16 },
      { header: "Pack Size", key: "packSize", width: 12 },
      { header: "Unit", key: "unitOfMeasure", width: 10 },
      { header: "Barcode", key: "barcode", width: 18 },
      { header: "SKU", key: "sku", width: 16 },
      { header: "DRAP Reg No", key: "drapRegNo", width: 16 },
      { header: "Available Stock", key: "stock", width: 16 },
      { header: "Retail Price (PKR)", key: "price", width: 18 },
      { header: "Prescription Required", key: "rx", width: 20 },
    ];

    // Style Header Row
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" }, // Indigo
    };

    medicines.forEach((med) => {
      const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      const retailPrice =
        med.batches.length > 0 ? Number(med.batches[0].retailPrice) : 0;

      sheet.addRow({
        name: med.name,
        genericName: med.genericName,
        category: med.category.name,
        manufacturer: med.manufacturer.name,
        dosageForm: med.dosageForm,
        strength: med.strength,
        packSize: med.packSize,
        unitOfMeasure: med.unitOfMeasure,
        barcode: med.barcode || "-",
        sku: med.sku || "-",
        drapRegNo: med.drapRegNo || "-",
        stock: totalStock,
        price: retailPrice,
        rx: med.prescriptionRequired ? "YES (Schedule D)" : "NO (OTC)",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Medicine_Catalog_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
