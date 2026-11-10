import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";

const COOKIE_NAME = "sufi_pharmacy_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default_super_secret_pharmacy_key_2026_at_least_32_chars!"
);

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  pharmacyId: string;
  pharmacyName: string;
  [key: string]: unknown;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Server-side security guard ensuring the current user has the required permission.
 */
export async function requireUserWithPermission(requiredPermission?: string): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Session expired or invalid. Please log in.");
  }

  // Active check directly from DB to prevent suspended accounts
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { isActive: true, role: true },
  });

  if (!dbUser || !dbUser.isActive) {
    throw new Error("FORBIDDEN: User account is deactivated or suspended.");
  }

  if (requiredPermission) {
    const { hasPermission } = await import("./permissions");
    const allowed = hasPermission(user.role, requiredPermission as any);
    if (!allowed) {
      throw new Error(`FORBIDDEN: Insufficient permissions for action: ${requiredPermission}`);
    }
  }

  return user;
}
