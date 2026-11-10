import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "sufi_pharmacy_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default_super_secret_pharmacy_key_2026_at_least_32_chars!"
);

// Protected route segments
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/pos",
  "/medicines",
  "/inventory",
  "/expiry",
  "/sales",
  "/purchases",
  "/suppliers",
  "/customers",
  "/prescriptions",
  "/returns",
  "/accounting",
  "/reports",
  "/staff",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root redirect to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch {
      // Invalid or expired token
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // If authenticated user visits /login, redirect to /dashboard
  if (pathname === "/login" && token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // Token expired, allow staying on login page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|logos|api/auth/login).*)",
  ],
};
