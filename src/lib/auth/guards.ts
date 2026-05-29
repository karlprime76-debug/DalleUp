import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { rateLimitRequest } from "@/lib/rate-limit";
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

export async function requireAdminApi(request?: Request) {
  if (request) {
    const limit = rateLimitRequest(request, "/api/admin");
    if (!limit.ok) {
      return { response: NextResponse.json({ message: "Trop de requêtes. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }) };
    }
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: NextResponse.json({ message: "Authentification requise." }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { response: NextResponse.json({ message: "Accès admin requis." }, { status: 403 }) };
  return { session };
}

export async function requireRestaurantApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: NextResponse.json({ message: "Authentification requise." }, { status: 401 }) };
  if (session.user.role !== "RESTAURANT") return { response: NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 }) };
  try {
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    if (!restaurant) return { response: NextResponse.json({ message: "Restaurant Prisma introuvable." }, { status: 404 }) };
    if (restaurant.status === "PENDING") return { response: NextResponse.json({ message: "Votre compte restaurant est en attente de validation." }, { status: 403 }) };
    if (restaurant.status === "SUSPENDED") return { response: NextResponse.json({ message: "Compte suspendu. Contactez le support." }, { status: 403 }) };
    return { session, restaurant };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[requireRestaurantApi] DB error", error);
    return { response: NextResponse.json({ message: "Indisponible. Base de données en cours de mise à jour. Réessayez dans quelques minutes." }, { status: 503 }) };
  }
}

export async function requireRestaurantApiBasic() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: NextResponse.json({ message: "Authentification requise." }, { status: 401 }) };
  if (session.user.role !== "RESTAURANT") return { response: NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 }) };
  try {
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    if (!restaurant) return { response: NextResponse.json({ message: "Restaurant Prisma introuvable." }, { status: 404 }) };
    if (restaurant.status === "SUSPENDED") return { response: NextResponse.json({ message: "Compte suspendu. Contactez le support." }, { status: 403 }) };
    return { session, restaurant };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[requireRestaurantApiBasic] DB error", error);
    return { response: NextResponse.json({ message: "Indisponible. Base de données en cours de mise à jour. Réessayez dans quelques minutes." }, { status: 503 }) };
  }
}

export async function requireRestaurant() {
  const session = await requireRole(["RESTAURANT"]);
  try {
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    if (!restaurant) redirect("/restaurant/onboarding");
    if (restaurant.status === "SUSPENDED") redirect("/restaurant/suspended");
    return { session, restaurant };
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    if (process.env.NODE_ENV !== "production") {
      console.error("[requireRestaurant] DB error", error);
    }
    redirect("/restaurant/onboarding");
  }
}

export async function requireApprovedRestaurant() {
  const result = await requireRestaurant();
  if (result.restaurant.status === "PENDING") redirect("/restaurant/pending");
  return result;
}

export async function requireApprovedDriver() {
  const session = await requireRole(["DELIVERY_DRIVER"]);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/driver/pending");
  if (user.driverStatus === "PENDING") redirect("/driver/pending");
  if (user.driverStatus === "SUSPENDED") redirect("/driver/suspended");
  if (user.driverStatus === "REJECTED") redirect("/driver/rejected");
  return { session, user };
}

export async function requireApprovedDriverApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: NextResponse.json({ message: "Authentification requise." }, { status: 401 }) };
  if (session.user.role !== "DELIVERY_DRIVER") return { response: NextResponse.json({ message: "Accès livreur requis." }, { status: 403 }) };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { response: NextResponse.json({ message: "Profil introuvable." }, { status: 404 }) };
  if (user.driverStatus === "PENDING") return { response: NextResponse.json({ message: "Votre profil livreur est en attente de validation." }, { status: 403 }) };
  if (user.driverStatus === "SUSPENDED") return { response: NextResponse.json({ message: "Compte suspendu. Contactez le support." }, { status: 403 }) };
  if (user.driverStatus === "REJECTED") return { response: NextResponse.json({ message: "Votre demande livreur a été rejetée." }, { status: 403 }) };
  return { session, user };
}
