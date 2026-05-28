import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rate-limit";
import type { UserRole } from "@/lib/auth/roles";

function getHeader(request: unknown, name: string): string | null {
  const headers = (request as { headers?: unknown })?.headers;
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name);
  const value = (headers as Record<string, string | string[] | undefined>)[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getClientIp(request: unknown): string {
  const forwarded = getHeader(request, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials, req) {
        const ip = getClientIp(req);
        const limit = rateLimit(ip, "/api/login");
        if (!limit.ok) {
          throw new Error("RATE_LIMITED:" + String(limit.retryAfter ?? 60));
        }

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as UserRole
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};
