import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { normalizePlaceName } from "@/lib/places/normalize";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get("q") ?? "").trim();
    const commune = String(searchParams.get("commune") ?? "").trim();
    const type = String(searchParams.get("type") ?? "").trim();
    const nearLat = searchParams.get("nearLat");
    const nearLng = searchParams.get("nearLng");
    // nearLat/nearLng reserved for future distance sorting

    if (!q) {
      return NextResponse.json({ places: [] });
    }

    const normalized = normalizePlaceName(q);
    const words = normalized.split(/\s+/).filter(Boolean);

    const orConditions: Array<Record<string, unknown>> = [
      { name: { contains: q, mode: "insensitive" } },
      { normalizedName: { contains: normalized, mode: "insensitive" } },
    ];

    if (words.length > 1) {
      for (const w of words) {
        if (w.length > 2) {
          orConditions.push({ name: { contains: w, mode: "insensitive" } });
        }
      }
    }

    const where: Record<string, unknown> = {
      isActive: true,
      isPublic: true,
      OR: orConditions,
    };

    if (commune) {
      where.commune = { contains: commune, mode: "insensitive" };
    }
    if (type) {
      where.type = type;
    }

    const places = await prisma.place.findMany({
      where,
      orderBy: [
        { isVerified: "desc" },
        { popularityScore: "desc" },
        { searchWeight: "desc" },
      ],
      take: 20,
    });

    const results = places.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      commune: p.commune,
      neighborhood: p.neighborhood,
      latitude: p.latitude,
      longitude: p.longitude,
      isVerified: p.isVerified,
      popularityScore: p.popularityScore,
    }));

    return NextResponse.json({ places: results });
  } catch (error) {
    console.error("[DalleUp] GET /api/places/search", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
