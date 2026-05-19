import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { getRestaurantSettings } from "@/lib/data/restaurant-settings";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });
  const settings = await getRestaurantSettings(session.user.id);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant Prisma introuvable." }, { status: 404 });
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const address = String(body.address ?? "").trim();
    if (!name || !description || !address) return NextResponse.json({ message: "Nom, description et adresse requis." }, { status: 400 });
    const deliveryFee = Math.max(0, Math.round(Number(body.deliveryFee ?? restaurant.deliveryFee)));
    const minDelayMin = Math.max(1, Math.round(Number(body.minDelayMin ?? restaurant.minDelayMin)));
    const maxDelayMin = Math.max(minDelayMin, Math.round(Number(body.maxDelayMin ?? restaurant.maxDelayMin)));
    const updated = await prisma.restaurant.update({ where: { id: restaurant.id }, data: { name, description, address, phone: String(body.phone ?? "").trim() || null, image: String(body.image ?? "").trim() || null, deliveryFee, minDelayMin, maxDelayMin } });
    return NextResponse.json({ settings: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp settings fallback] PATCH /api/restaurant/settings", error);
    return NextResponse.json({ message: "Paramètres indisponibles." }, { status: 503 });
  }
}
