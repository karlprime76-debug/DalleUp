import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const type = String(body.type ?? "").trim() || null;
    const addressText = String(body.addressText ?? "").trim() || null;
    const commune = String(body.commune ?? "").trim() || null;
    const neighborhood = String(body.neighborhood ?? "").trim() || null;
    const latitude = typeof body.latitude === "number" ? body.latitude : null;
    const longitude = typeof body.longitude === "number" ? body.longitude : null;
    const notes = String(body.notes ?? "").trim() || null;

    if (!name) {
      return NextResponse.json({ message: "Nom du lieu requis." }, { status: 400 });
    }

    const suggestion = await prisma.placeSuggestion.create({
      data: {
        suggestedById: userId,
        suggestedByRole: session?.user?.role ?? "CLIENT",
        name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: type as any,
        addressText,
        commune,
        neighborhood,
        latitude,
        longitude,
        notes,
      },
    });

    return NextResponse.json({ id: suggestion.id, status: "PENDING" });
  } catch (error) {
    console.error("[DalleUp] POST /api/places/suggestions", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
