import { NextResponse } from "next/server";
import { searchBeninPlaces } from "@/lib/geo/search-places";

export type AutocompletePlaceResponse = {
  id: string;
  name: string;
  label: string;
  secondaryText: string;
  type: string;
  department: string | null;
  commune: string | null;
  arrondissement: string | null;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  source: "local";
};

function formatLabel(place: ReturnType<typeof searchBeninPlaces>[number]): string {
  const parts: string[] = [place.name];
  if (place.city && place.city !== place.name) parts.push(place.city);
  if (place.department && !parts.includes(place.department)) parts.push(place.department);
  return parts.join(", ");
}

function formatSecondaryText(place: ReturnType<typeof searchBeninPlaces>[number]): string {
  const parts: string[] = [];
  if (place.type === "COMMUNE") parts.push("Commune");
  else if (place.type === "QUARTIER") parts.push("Quartier");
  else if (place.type === "MARKET") parts.push("Marché");
  else if (place.type === "LANDMARK") parts.push("Lieu emblématique");
  else if (place.type === "DEPARTMENT") parts.push("Département");
  else if (place.type === "ARRONDISSEMENT") parts.push("Arrondissement");
  else if (place.type === "VILLAGE") parts.push("Village");
  else if (place.type === "AREA") parts.push("Zone");
  if (place.department) parts.push(place.department);
  return parts.join(" · ");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("query") ?? "").trim();

    if (query.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const places = searchBeninPlaces(query, 8);
    const results: AutocompletePlaceResponse[] = places.map((place) => ({
      id: place.id,
      name: place.name,
      label: formatLabel(place),
      secondaryText: formatSecondaryText(place),
      type: place.type,
      department: place.department,
      commune: place.commune,
      arrondissement: place.arrondissement,
      city: place.city,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      source: "local",
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
