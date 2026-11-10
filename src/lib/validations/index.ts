import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const medicineSchema = z.object({
  name: z.string().min(2, "Medicine name is required"),
  genericName: z.string().min(2, "Generic formula is required"),
  brandName: z.string().optional(),
  categoryId: z.string().min(1, "Please select a category"),
  manufacturerId: z.string().min(1, "Please select a manufacturer"),
  dosageForm: z.enum([
    "TABLET",
    "CAPSULE",
    "SYRUP",
    "SUSPENSION",
    "INJECTION",
    "OINTMENT",
    "CREAM",
    "DROPS",
    "INHALER",
    "POWDER",
    "GEL",
    "DEVICE",
    "OTHER",
  ]),
  strength: z.string().min(1, "Strength is required (e.g. 500mg)"),
  packSize: z.coerce.number().min(1, "Pack size must be at least 1"),
  unitOfMeasure: z.string().default("BOX"),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  drapRegNo: z.string().optional(),
  prescriptionRequired: z.boolean().default(false),
  storageCondition: z.enum([
    "ROOM_TEMPERATURE",
    "REFRIGERATED_2_8C",
    "COOL_DRY_PLACE",
    "PROTECT_FROM_LIGHT",
  ]),
  description: z.string().optional(),
  minStockLevel: z.coerce.number().min(0).default(10),
  maxStockLevel: z.coerce.number().min(1).default(500),
  isActive: z.boolean().default(true),
});

export const batchSchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().min(1, "Expiry date is required"),
  purchaseCost: z.coerce.number().min(0, "Purchase cost must be non-negative"),
  tradePrice: z.coerce.number().min(0, "Trade price must be non-negative"),
  retailPrice: z.coerce.number().min(0, "Retail price must be non-negative"),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative"),
});

export const checkoutSchema = z.object({
  customerId: z.string().nullable().optional(),
  prescriptionId: z.string().nullable().optional(),
  items: z.array(
    z.object({
      medicineId: z.string().min(1),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
      unitPrice: z.number().min(0),
      lineDiscount: z.number().min(0).default(0),
    })
  ).min(1, "Cart cannot be empty"),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  paymentMethod: z.enum([
    "CASH",
    "CARD",
    "BANK_TRANSFER",
    "CREDIT",
    "EASYPAISA_JAZZCASH",
    "SPLIT",
  ]),
  paidAmount: z.number().min(0),
  notes: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().min(7, "Valid contact number required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().default("Lahore"),
  ntnNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  openingBalance: z.coerce.number().default(0),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  phone: z.string().min(7, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  creditLimit: z.coerce.number().min(0).default(0),
});

export const prescriptionSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  patientAge: z.coerce.number().optional(),
  patientGender: z.enum(["Male", "Female", "Other"]).optional(),
  doctorName: z.string().min(2, "Prescriber/Doctor name is required"),
  pmdcNumber: z.string().optional(),
  clinicHospital: z.string().optional(),
  prescriptionDate: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      medicineName: z.string().min(1, "Medicine name is required"),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      durationDays: z.coerce.number().optional(),
      quantityPrescribed: z.coerce.number().min(1),
    })
  ).min(1, "At least one prescribed item is required"),
});

export const expenseSchema = z.object({
  title: z.string().min(2, "Expense title is required"),
  category: z.enum([
    "RENT",
    "UTILITIES",
    "SALARIES",
    "SUPPLIES",
    "MAINTENANCE",
    "LICENSES_PERMITS",
    "MARKETING",
    "TAXES",
    "OTHER",
  ]),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "EASYPAISA_JAZZCASH"]),
  paidTo: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});
