import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";

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

    // Placeholder: real OSM import would query Overpass API
    return NextResponse.json({
      message: "Import OSM simulé.",
      commune,
      bbox,
      imported: 0,
      note: "Implémenter requête Overpass API ici.",
    });
  } catch (error) {
    console.error("[DalleUp] POST /api/admin/places/import/osm", error);
    return NextResponse.json({ message: "Erreur." }, { status: 503 });
  }
}
