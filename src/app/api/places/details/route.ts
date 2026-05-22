import { NextResponse } from "next/server";
import { getPlaceById } from "@/lib/geo/search-places";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get("id") ?? "").trim();

    if (!id) {
      return NextResponse.json({ message: "Identifiant requis." }, { status: 400 });
    }

    const place = getPlaceById(id);
    if (!place) {
      return NextResponse.json({ message: "Lieu introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      id: place.id,
      name: place.name,
      type: place.type,
      department: place.department,
      commune: place.commune,
      arrondissement: place.arrondissement,
      city: place.city,
      country: place.country,
      aliases: place.aliases,
      latitude: place.latitude,
      longitude: place.longitude,
      priority: place.priority,
      isServiceable: place.isServiceable,
      source: "local",
    });
  } catch {
    return NextResponse.json({ message: "Service temporairement indisponible." }, { status: 503 });
  }
}
