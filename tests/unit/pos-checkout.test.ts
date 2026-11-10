import { describe, it, expect } from "vitest";
import { checkoutSchema } from "@/lib/validations";

describe("POS Checkout Validation & Rules", () => {
  it("should validate valid POS checkout payload", () => {
    const validPayload = {
      customerId: "cust-1",
      items: [
        {
          medicineId: "med-1",
          quantity: 2,
          unitPrice: 800,
          lineDiscount: 0,
        },
        {
          medicineId: "med-2",
          quantity: 1,
          unitPrice: 365,
          lineDiscount: 15,
        },
      ],
      discountAmount: 50,
      taxAmount: 0,
      paymentMethod: "CASH",
      paidAmount: 1900,
      notes: "Regular prescription dispensing",
    };

    const res = checkoutSchema.safeParse(validPayload);
    expect(res.success).toBe(true);
  });

  it("should reject checkout with empty items", () => {
    const emptyPayload = {
      items: [],
      discountAmount: 0,
      taxAmount: 0,
      paymentMethod: "CASH",
      paidAmount: 0,
    };

    const res = checkoutSchema.safeParse(emptyPayload);
    expect(res.success).toBe(false);
  });

  it("should reject invalid payment methods", () => {
    const invalidMethod = {
      items: [{ medicineId: "m1", quantity: 1, unitPrice: 100, lineDiscount: 0 }],
      discountAmount: 0,
      taxAmount: 0,
      paymentMethod: "BITCOIN",
      paidAmount: 100,
    };

    const res = checkoutSchema.safeParse(invalidMethod);
    expect(res.success).toBe(false);
  });
});
