import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { getRestaurantMenuForOwner } from "@/lib/data/restaurant-menu";
import { prisma } from "@/lib/db/prisma";

function isValidImageUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });
  const data = await getRestaurantMenuForOwner(session.user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant Prisma introuvable." }, { status: 404 });
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const price = Number(body.price ?? 0);
    const image = String(body.image ?? "").trim();
    const isActive = typeof body.isActive === "boolean" ? body.isActive : Boolean(body.isActive ?? true);
    if (name.length < 2) return NextResponse.json({ message: "Le nom du produit doit contenir au moins 2 caractères." }, { status: 400 });
    if (description.length < 5) return NextResponse.json({ message: "La description du produit doit contenir au moins 5 caractères." }, { status: 400 });
    if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ message: "Le prix du produit doit être supérieur à zéro." }, { status: 400 });
    if (!isValidImageUrl(image)) return NextResponse.json({ message: "L’image doit être une URL HTTPS valide ou un chemin local." }, { status: 400 });
    const categoryName = String(body.category ?? "Menu").trim() || "Menu";
    if (categoryName.length > 80) return NextResponse.json({ message: "La catégorie est trop longue." }, { status: 400 });
    const category = await prisma.menuCategory.findFirst({ where: { restaurantId: restaurant.id, name: categoryName } }) ?? await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: categoryName } });
    const item = await prisma.menuItem.create({ data: { restaurantId: restaurant.id, categoryId: category.id, name, description, price: Math.round(price), image: image || null, isActive } });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp menu fallback] POST /api/restaurant/menu", error);
    return NextResponse.json({ message: "Création produit indisponible." }, { status: 503 });
  }
}
