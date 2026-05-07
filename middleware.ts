import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAdminPath = pathname.startsWith("/admin");
  const isPortalPath = pathname.startsWith("/portal");
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isApiPortal = pathname.startsWith("/api/portal");

  if (!token && (isAdminPath || isPortalPath)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!token && (isApiAdmin || isApiPortal)) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (token && (isAdminPath || isApiAdmin) && token.role !== "ADMIN") {
    if (isApiAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/portal", req.url));
  }

  if (token && (isPortalPath || isApiPortal) && token.role === "ADMIN") {
    if (isPortalPath) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // Redirect users who must change their password to the dedicated page
  if (
    token &&
    (token as { mustChangePassword?: boolean }).mustChangePassword === true &&
    isPortalPath &&
    pathname !== "/portal/change-password"
  ) {
    return NextResponse.redirect(new URL("/portal/change-password", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/api/admin/:path*",
    "/api/portal/:path*",
  ],
};
