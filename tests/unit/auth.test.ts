import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { UserRole } from "@prisma/client";

describe("Authentication & RBAC Unit Tests", () => {
  it("should securely hash and verify passwords using bcrypt", async () => {
    const plain = "Secret@Pharmacy2026";
    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    expect(await verifyPassword(plain, hashed)).toBe(true);
    expect(await verifyPassword("WrongPassword", hashed)).toBe(false);
  });

  it("should generate and verify tamper-proof JWT session tokens", async () => {
    const payload = {
      userId: "user-123",
      email: "pharmacist@pharmacy.local",
      fullName: "Dr. Ayesha",
      role: UserRole.PHARMACIST,
      pharmacyId: "pharm-1",
      pharmacyName: "Sufi Pharmacy",
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe("string");

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe(payload.role);
  });

  it("should enforce role-based access control matrix accurately", () => {
    // Admin has superuser override on all permissions
    expect(hasPermission(UserRole.ADMIN, PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
    expect(hasPermission(UserRole.SUPER_ADMIN, PERMISSIONS.USERS_MANAGE)).toBe(true);

    // Pharmacist can view & verify prescriptions but not manage settings
    expect(hasPermission(UserRole.PHARMACIST, PERMISSIONS.PRESCRIPTIONS_VERIFY)).toBe(true);
    expect(hasPermission(UserRole.PHARMACIST, PERMISSIONS.SETTINGS_MANAGE)).toBe(false);

    // Cashier can create sales but cannot manage staff or adjust accounting
    expect(hasPermission(UserRole.CASHIER, PERMISSIONS.SALES_CREATE)).toBe(true);
    expect(hasPermission(UserRole.CASHIER, PERMISSIONS.ACCOUNTING_MANAGE)).toBe(false);

    // Inventory manager can adjust inventory but cannot refund sales
    expect(hasPermission(UserRole.INVENTORY_MANAGER, PERMISSIONS.INVENTORY_ADJUST)).toBe(true);
    expect(hasPermission(UserRole.INVENTORY_MANAGER, PERMISSIONS.SALES_REFUND)).toBe(false);
  });
});
