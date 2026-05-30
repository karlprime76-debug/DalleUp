import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { isProbablyDuplicate, normalizePlaceName } from "@/lib/places/normalize";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const { searchParams } = new URL(request.url);
    const commune = String(searchParams.get("commune") ?? "").trim();

    const where: Record<string, unknown> = { isActive: true };
    if (commune) where.commune = { contains: commune, mode: "insensitive" };

    const places = await prisma.place.findMany({ where, take: 500 });
    const duplicates: Array<{ keep: typeof places[0]; remove: typeof places[0]; reason: string }> = [];

    for (let i = 0; i < places.length; i++) {
      for (let j = i + 1; j < places.length; j++) {
        const a = places[i];
        const b = places[j];
        if (a.id === b.id) continue;
        if (
          isProbablyDuplicate(
            { name: a.name, commune: a.commune, latitude: a.latitude, longitude: a.longitude, googlePlaceId: a.googlePlaceId, osmId: a.osmId },
            { name: b.name, commune: b.commune, latitude: b.latitude, longitude: b.longitude, googlePlaceId: b.googlePlaceId, osmId: b.osmId }
          )
        ) {
          const keep = a.popularityScore >= b.popularityScore ? a : b;
          const remove = a.popularityScore >= b.popularityScore ? b : a;
          duplicates.push({ keep, remove, reason: `${normalizePlaceName(a.name)} ≈ ${normalizePlaceName(b.name)}` });
        }
      }
    }

    return NextResponse.json({ duplicates: duplicates.slice(0, 50) });
  } catch (error) {
    console.error("[DalleUp] GET /api/admin/places/duplicates", error);
    return NextResponse.json({ message: "Erreur." }, { status: 503 });
  }
}
