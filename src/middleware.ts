import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, reason: "not_authenticated" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session.mustChangePassword && pathname !== "/change-password" && pathname !== "/api/auth/change-password") {
    const changePasswordUrl = new URL("/change-password", request.url);
    return NextResponse.redirect(changePasswordUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets, so the dashboard, its API
     * routes, and the forced change-password redirect are all covered.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
