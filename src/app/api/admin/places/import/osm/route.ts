import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import {
  mapOsmTagsToPlaceType,
  normalizePlaceName,
  computePopularityScore,
  buildPlaceSlug,
} from "@/lib/places/normalize";

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function buildOverpassQuery(commune: string) {
  const areaName = commune.replace(/"/g, '"');
  return `[out:json][timeout:60];\narea["name"="${areaName}"]->.searchArea;\n(\n  node["amenity"~"bar|pub|cafe|restaurant|fast_food|food_court|pharmacy|clinic|hospital|school|university|bank|atm|fuel|place_of_worship"](area.searchArea);\n  way["amenity"~"bar|pub|cafe|restaurant|fast_food|food_court|pharmacy|clinic|hospital|school|university|bank|atm|fuel|place_of_worship"](area.searchArea);\n  node["shop"~"supermarket|convenience|bakery|pastry|mall"](area.searchArea);\n  way["shop"~"supermarket|convenience|bakery|pastry|mall"](area.searchArea);\n  node["leisure"~"fitness_centre|sports_centre|pitch"](area.searchArea);\n  way["leisure"~"fitness_centre|sports_centre|pitch"](area.searchArea);\n  node["tourism"~"hotel|attraction"](area.searchArea);\n  way["tourism"~"hotel|attraction"](area.searchArea);\n);\nout center tags;`;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const body = await request.json().catch(() => ({}));
    const commune = String(body.commune ?? "").trim();
    const bbox = String(body.bbox ?? "").trim();

    if (!commune && !bbox) {
      return NextResponse.json({ message: "commune ou bbox requis." }, { status: 400 });
    }

    let elements: OsmElement[] = [];
    try {
      const query = buildOverpassQuery(commune || "Cotonou");
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      const data = await res.json();
      elements = (data.elements ?? []).filter(
        (e: OsmElement) => e.tags && e.tags.name
      );
    } catch (err) {
      console.error("[DalleUp] Overpass error:", err);
      return NextResponse.json({ message: "Overpass indisponible." }, { status: 502 });
    }

    let imported = 0;
    let skipped = 0;

    for (const el of elements.slice(0, 500)) {
      const tags = el.tags ?? {};
      const name = tags.name.trim();
      if (!name) continue;

      const placeType = mapOsmTagsToPlaceType(tags);
      if (!placeType) continue;

      const lat = el.lat ?? el.center?.lat ?? null;
      const lng = el.lon ?? el.center?.lon ?? null;
      const osmId = String(el.id);
      const slug = buildPlaceSlug(name, commune || "Cotonou", placeType);
      const normalizedName = normalizePlaceName(name);

      const existing = await prisma.place.findFirst({
        where: {
          OR: [
            { osmId },
            { slug },
            { normalizedName, commune: commune || undefined },
          ],
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const aliases: string[] = [];
      if (tags["name:fr"]) aliases.push(tags["name:fr"]);
      if (tags.alt_name) aliases.push(...tags.alt_name.split(";"));

      await prisma.place.create({
        data: {
          name,
          slug,
          normalizedName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: placeType as any,
          country: "Bénin",
          commune: commune || "Cotonou",
          city: commune || "Cotonou",
          addressText: tags["addr:street"] ?? null,
          description: tags.description ?? null,
          aliases: aliases.length ? aliases : null,
          latitude: lat,
          longitude: lng,
          source: "OPENSTREETMAP",
          osmId,
          osmType: el.type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          osmTags: tags as any,
          isPublic: true,
          isVerified: false,
          isActive: true,
          deliveryEnabled: false,
          popularityScore: computePopularityScore(placeType, false, "OPENSTREETMAP"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
      imported++;
    }

    return NextResponse.json({
      message: "Import OSM terminé.",
      commune: commune || "Cotonou",
      total: elements.length,
      imported,
      skipped,
    });
  } catch (error) {
    console.error("[DalleUp] POST /api/admin/places/import/osm", error);
    return NextResponse.json({ message: "Erreur." }, { status: 503 });
  }
}
