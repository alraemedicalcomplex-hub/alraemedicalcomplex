import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number or Decimal to Pakistani Rupee representation.
 * Example: 154200.50 -> "Rs. 154,200.50"
 */
export function formatCurrency(
  amount: number | string | { toString: () => string } | null | undefined,
  showCode: boolean = false
): string {
  if (amount === null || amount === undefined) {
    return showCode ? "PKR 0.00" : "Rs. 0.00";
  }
  const numeric = typeof amount === "number" ? amount : parseFloat(amount.toString());
  if (isNaN(numeric)) {
    return showCode ? "PKR 0.00" : "Rs. 0.00";
  }

  // Format with standard Pakistani / international 2 decimal places
  const formatted = numeric.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return showCode ? `PKR ${formatted}` : `Rs. ${formatted}`;
}

/**
 * Standard Pakistani Pharmacy Date Format: DD-MM-YYYY
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  includeTime: boolean = false
): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    if (!isValid(d)) return "-";
    return format(d, includeTime ? "dd-MM-yyyy hh:mm a" : "dd-MM-yyyy");
  } catch {
    return "-";
  }
}

/**
 * Short month year format for batch expiry (e.g. MM/YY or MMM-yyyy)
 */
export function formatExpiryDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    if (!isValid(d)) return "-";
    return format(d, "MM/yyyy");
  } catch {
    return "-";
  }
}

/**
 * Safe decimal addition, subtraction, multiplication with precision
 */
export function roundDecimal(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}
