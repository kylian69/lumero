import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { verifyTotp } from "@/lib/totp";
import { authCookie } from "@/lib/auth-cookie";
import { recordLog } from "@/lib/log";

type AuthReq = { headers?: Record<string, string | string[] | undefined> };

function header(req: AuthReq | undefined, name: string): string | null {
  const v = req?.headers?.[name];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

async function logLoginFailure(
  email: string,
  reason: string,
  req: AuthReq | undefined,
  userId?: string | null,
) {
  const fwd = header(req, "x-forwarded-for");
  await recordLog({
    userId: userId ?? null,
    level: "WARN",
    category: "AUTH",
    entityType: "auth",
    entityId: email,
    action: "login_failed",
    message: `Échec de connexion (${reason})`,
    metadata: { email, reason },
    ip: fwd ? fwd.split(",")[0]!.trim() : header(req, "x-real-ip"),
    userAgent: header(req, "user-agent"),
  });
}

const cookie = authCookie();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: cookie.name,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: cookie.secure,
        domain: cookie.domain,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        otp: { label: "Code 2FA", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
          await logLoginFailure(email, "unknown_account", req as AuthReq);
          return null;
        }
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) {
          await logLoginFailure(email, "bad_password", req as AuthReq, user.id);
          return null;
        }
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const otp = (credentials.otp ?? "").trim();
          if (!otp) {
            throw new Error("OTP_REQUIRED");
          }
          if (!verifyTotp(otp, user.twoFactorSecret)) {
            await logLoginFailure(email, "bad_otp", req as AuthReq, user.id);
            throw new Error("OTP_INVALID");
          }
        }
        await recordLog({
          userId: user.id,
          level: "INFO",
          category: "AUTH",
          entityType: "auth",
          entityId: user.id,
          action: "login_success",
          message: "Connexion réussie",
          metadata: { email, role: user.role },
          ip: (() => {
            const fwd = header(req as AuthReq, "x-forwarded-for");
            return fwd ? fwd.split(",")[0]!.trim() : header(req as AuthReq, "x-real-ip");
          })(),
          userAgent: header(req as AuthReq, "user-agent"),
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
        token.mustChangePassword = (user as unknown as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      // Allow client-side update() call to refresh mustChangePassword in token
      if (trigger === "update" && session?.mustChangePassword === false) {
        token.mustChangePassword = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as Role;
        (session.user as { mustChangePassword?: boolean }).mustChangePassword =
          (token.mustChangePassword as boolean) ?? false;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
