import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ addresses: [] });
    }
    const addresses = await prisma.savedAddress.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
      take: 20,
    });
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("[DalleUp] GET /api/user/saved-addresses", error);
    return NextResponse.json({ addresses: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non connecté." }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const label = String(body.label ?? "").trim() || "Adresse";
    const addressText = String(body.addressText ?? "").trim();
    const commune = String(body.commune ?? "").trim() || null;
    const neighborhood = String(body.neighborhood ?? "").trim() || null;
    const landmarkText = String(body.landmarkText ?? "").trim() || null;
    const instructions = String(body.instructions ?? "").trim() || null;
    const phone = String(body.phone ?? "").trim() || null;
    const latitude = typeof body.latitude === "number" ? body.latitude : null;
    const longitude = typeof body.longitude === "number" ? body.longitude : null;
    const placeId = String(body.placeId ?? "").trim() || null;

    if (!addressText) {
      return NextResponse.json({ message: "Adresse requise." }, { status: 400 });
    }

    const address = await prisma.savedAddress.create({
      data: {
        userId: session.user.id,
        label,
        phone,
        addressText,
        commune,
        neighborhood,
        landmarkText,
        instructions,
        latitude,
        longitude,
        placeId,
        isDefault: false,
        isPrivate: true,
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("[DalleUp] POST /api/user/saved-addresses", error);
    return NextResponse.json({ message: "Erreur." }, { status: 503 });
  }
}
