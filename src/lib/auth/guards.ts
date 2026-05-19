import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { canAccess, getDashboardPathByRole, type UserRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!canAccess(session.user.role, allowedRoles)) redirect(getDashboardPathByRole(session.user.role));
  return session;
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export async function requireAdminApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: NextResponse.json({ message: "Authentification requise." }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { response: NextResponse.json({ message: "Accès admin requis." }, { status: 403 }) };
  return { session };
}

export async function requireRestaurantApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: NextResponse.json({ message: "Authentification requise." }, { status: 401 }) };
  if (session.user.role !== "RESTAURANT") return { response: NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 }) };
  const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
  if (!restaurant) return { response: NextResponse.json({ message: "Restaurant Prisma introuvable." }, { status: 404 }) };
  return { session, restaurant };
}
