import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, roundDecimal } from "@/lib/utils";

describe("Inventory & Batch Calculations", () => {
  it("should format Pakistani currency correctly with Rs. and comma grouping", () => {
    expect(formatCurrency(154200.5)).toContain("154,200.50");
    expect(formatCurrency(0)).toContain("0.00");
    expect(formatCurrency(null)).toContain("0.00");
    expect(formatCurrency(800, true)).toBe("PKR 800.00");
  });

  it("should format Pakistani standard date format as DD-MM-YYYY", () => {
    const d = new Date("2026-11-10T12:00:00Z");
    const formatted = formatDate(d);
    expect(formatted).toBe("10-11-2026");
  });

  it("should prevent floating-point precision errors during decimal operations", () => {
    const price = 365.25;
    const qty = 3;
    const discount = 15.5;

    const subtotal = roundDecimal(price * qty);
    expect(subtotal).toBe(1095.75);

    const net = roundDecimal(subtotal - discount);
    expect(net).toBe(1080.25);
  });
});
