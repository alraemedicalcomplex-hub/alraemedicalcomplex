import { UserRole, DosageForm, StorageCondition, BatchStatus, PaymentMethod, PaymentStatus, SaleStatus, PurchaseStatus, ExpenseCategory, PrescriptionStatus } from "@prisma/client";

export interface DashboardMetrics {
  todaySales: number;
  yesterdaySales: number;
  monthlyRevenue: number;
  grossProfit: number;
  netProfit: number;
  totalPurchases: number;
  totalExpenses: number;
  totalMedicines: number;
  totalStockQuantity: number;
  inventoryValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
  supplierPayables: number;
  customerReceivables: number;
  recentSales: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }[];
  topSelling: {
    name: string;
    genericName: string;
    quantity: number;
    revenue: number;
  }[];
  monthlyChart: {
    month: string;
    sales: number;
    purchases: number;
    expenses: number;
  }[];
}

export interface POSCartItem {
  medicineId: string;
  name: string;
  genericName: string;
  dosageForm: DosageForm;
  strength: string;
  barcode?: string | null;
  unitPrice: number;
  tradePrice: number;
  purchaseCost: number;
  quantity: number;
  availableStock: number;
  lineDiscount: number; // percentage or fixed
  batchNumber?: string;
  expiryDate?: string;
  prescriptionRequired: boolean;
}

export interface POSCheckoutRequest {
  customerId?: string | null;
  prescriptionId?: string | null;
  items: {
    medicineId: string;
    quantity: number;
    unitPrice: number;
    lineDiscount: number;
  }[];
  discountAmount: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  notes?: string;
}

export interface POSHeldSale {
  id: string;
  title: string;
  timestamp: string;
  items: POSCartItem[];
  customerName?: string;
}
