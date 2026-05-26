import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        status: true,
        isPopular: true,
        rating: true,
        image: true,
        _count: { select: { menuItems: true, orders: true } }
      }
    });

    return NextResponse.json({ restaurants });
  } catch {
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.restaurantId || typeof body.isPopular !== "boolean") {
      return NextResponse.json({ message: "Paramètres invalides." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: body.restaurantId },
      data: { isPopular: body.isPopular },
      select: { id: true, name: true, isPopular: true, status: true }
    });

    return NextResponse.json({ restaurant });
  } catch {
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
