import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") ?? "NaN");
    const lng = parseFloat(searchParams.get("lng") ?? "NaN");
    const radius = parseFloat(searchParams.get("radius") ?? "3000");
    const type = String(searchParams.get("type") ?? "").trim();

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ message: "lat et lng requis." }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      isActive: true,
      isPublic: true,
      latitude: { not: null },
      longitude: { not: null },
    };

    if (type) {
      where.type = type;
    }

    const places = await prisma.place.findMany({
      where,
      orderBy: [
        { isVerified: "desc" },
        { popularityScore: "desc" },
      ],
      take: 50,
    });

    const results = places
      .map((p) => {
        const d = haversine(lat, lng, p.latitude ?? 0, p.longitude ?? 0);
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          commune: p.commune,
          neighborhood: p.neighborhood,
          latitude: p.latitude,
          longitude: p.longitude,
          distance: Math.round(d),
          isVerified: p.isVerified,
        };
      })
      .filter((p) => p.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    return NextResponse.json({ places: results });
  } catch (error) {
    console.error("[DalleUp] GET /api/places/nearby", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
