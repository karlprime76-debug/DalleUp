import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const body = await request.json().catch(() => ({}));
    const commune = String(body.commune ?? "").trim();
    const type = String(body.type ?? "").trim();

    if (!commune) {
      return NextResponse.json({ message: "commune requis." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "GOOGLE_MAPS_API_KEY non configurée." }, { status: 400 });
    }

    // Placeholder: real Google Places import would call Google Places API
    return NextResponse.json({
      message: "Import Google Places simulé.",
      commune,
      type,
      apiKeyConfigured: true,
      imported: 0,
      note: "Implémenter appel Google Places API ici avec pagination.",
    });
  } catch (error) {
    console.error("[DalleUp] POST /api/admin/places/import/google", error);
    return NextResponse.json({ message: "Erreur." }, { status: 503 });
  }
}
