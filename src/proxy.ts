import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-token";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"]);

/**
 * Server-side gate for admin pages: no valid admin token, no admin HTML.
 * APIs still authorize every request themselves (with a DB check).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Login decides "already signed in" itself via the DB-checked API, which avoids
  // a redirect loop for removed admins whose token signature is still valid.
  // Password recovery pages must work while signed out.
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  let valid = false;
  if (token) {
    try {
      await verifyAdminToken(token);
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(login);
    if (token) res.cookies.delete(ADMIN_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
