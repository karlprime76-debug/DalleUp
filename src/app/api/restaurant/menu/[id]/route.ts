import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

async function getOwnedMenuItem(ownerId: string, id: string) {
  return prisma.menuItem.findFirst({ where: { id, restaurant: { ownerId } } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });
    const { id } = await params;
    const existing = await getOwnedMenuItem(session.user.id, id);
    if (!existing) return NextResponse.json({ message: "Produit introuvable." }, { status: 404 });
    const body = await request.json();
    const data = {
      name: body.name === undefined ? undefined : String(body.name).trim(),
      description: body.description === undefined ? undefined : String(body.description).trim(),
      price: body.price === undefined ? undefined : Math.round(Number(body.price)),
      image: body.image === undefined ? undefined : String(body.image).trim() || null,
      isActive: body.isActive === undefined ? undefined : Boolean(body.isActive)
    };
    const categoryName = body.category === undefined ? undefined : String(body.category ?? "").trim();
    const category = categoryName ? await prisma.menuCategory.findFirst({ where: { restaurantId: existing.restaurantId, name: categoryName } }) ?? await prisma.menuCategory.create({ data: { restaurantId: existing.restaurantId, name: categoryName } }) : null;
    const item = await prisma.menuItem.update({ where: { id: existing.id }, data: { ...data, categoryId: category ? category.id : undefined } });
    return NextResponse.json({ item });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp menu fallback] PATCH /api/restaurant/menu/[id]", error);
    return NextResponse.json({ message: "Modification produit indisponible." }, { status: 503 });
  }
}
