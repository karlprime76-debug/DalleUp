import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { normalizePlaceName, computePopularityScore } from "@/lib/places/normalize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      data.name = body.name.trim();
      data.normalizedName = normalizePlaceName(body.name);
    }
    if (typeof body.slug === "string") data.slug = body.slug.trim();
    if (typeof body.type === "string") data.type = body.type;
    if (typeof body.aliases === "object") data.aliases = body.aliases;
    if (typeof body.addressText === "string") data.addressText = body.addressText.trim();
    if (typeof body.commune === "string") data.commune = body.commune.trim();
    if (typeof body.neighborhood === "string") data.neighborhood = body.neighborhood.trim();
    if (typeof body.latitude === "number") data.latitude = body.latitude;
    if (typeof body.longitude === "number") data.longitude = body.longitude;
    if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.isVerified === "boolean") data.isVerified = body.isVerified;
    if (typeof body.deliveryEnabled === "boolean") data.deliveryEnabled = body.deliveryEnabled;
    if (typeof body.popularityScore === "number") data.popularityScore = body.popularityScore;
    if (typeof body.searchWeight === "number") data.searchWeight = body.searchWeight;

    if (data.isVerified && !data.popularityScore) {
      const place = await prisma.place.findUnique({ where: { id } });
      if (place) {
        data.popularityScore = computePopularityScore(place.type, true, String(place.source));
      }
    }

    const updated = await prisma.place.update({
      where: { id },
      data,
    });

    return NextResponse.json({ place: updated });
  } catch (error) {
    console.error("[DalleUp] PATCH /api/admin/places/[id]", error);
    return NextResponse.json({ message: "Erreur." }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const { id } = await params;
    await prisma.place.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DalleUp] DELETE /api/admin/places/[id]", error);
    return NextResponse.json({ message: "Erreur." }, { status: 503 });
  }
}
