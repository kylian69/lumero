import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { Role } from "@prisma/client";
import { authCookie } from "@/lib/auth-cookie";
import { canAccessPreview } from "@/lib/preview-access";

export const dynamic = "force-dynamic";

// Appelé en server-to-server par le preview-orchestrator (proxy) pour savoir si
// le visiteur courant peut accéder à la preview. Le proxy relaie le header
// Cookie du navigateur ; on décode le JWT NextAuth pour identifier l'utilisateur.
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-internal-token");
  if (!token || token !== process.env.PREVIEW_INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const cookie = authCookie();
  const jwt = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: cookie.name,
    secureCookie: cookie.secure,
  })) as { uid?: string; role?: Role } | null;

  if (!jwt?.uid) {
    return NextResponse.json({ authenticated: false, allowed: false });
  }

  const allowed = await canAccessPreview(
    { id: jwt.uid, role: (jwt.role ?? "CLIENT") as Role },
    projectId
  );
  return NextResponse.json({ authenticated: true, allowed });
}
