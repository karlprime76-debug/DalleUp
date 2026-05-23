import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

function missingRestaurantFields(restaurant: { name: string; description: string; address: string; phone?: string | null; image?: string | null } | null) {
  if (!restaurant) return ["restaurant"];
  const missing: string[] = [];
  if (!restaurant.name) missing.push("name");
  if (!restaurant.phone) missing.push("phone");
  if (!restaurant.address || restaurant.address === "Non renseigné") missing.push("address");
  if (!restaurant.description || restaurant.description === "En attente de configuration") missing.push("description");
  if (!restaurant.image) missing.push("image");
  return missing;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  if (session.user.role !== "RESTAURANT") return NextResponse.json({ message: "Accès restaurant requis." }, { status: 403 });

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, description: true, address: true, phone: true, image: true, status: true },
  });

  return NextResponse.json({
    user: {
      id: session.user.id,
      role: session.user.role,
    },
    restaurantFound: Boolean(restaurant),
    restaurant: restaurant
      ? {
          id: restaurant.id,
          status: restaurant.status,
          missingFields: missingRestaurantFields(restaurant),
        }
      : null,
  });
}
