import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "taha_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  // Public admin entry points.
  if (pathname === "/admin/login" || pathname === "/admin/login/") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let valid = false;
  if (token) {
    const secret = process.env.AUTH_SECRET;
    if (secret) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
          algorithms: ["HS256"],
        });
        valid = Boolean(payload.sub);
      } catch {
        valid = false;
      }
    }
  }

  if (valid) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Don't redirect public-looking admin assets.
  if (pathname.includes("_next")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};