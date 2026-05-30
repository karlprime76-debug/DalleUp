import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const { searchParams } = new URL(request.url);
    const commune = String(searchParams.get("commune") ?? "").trim();
    const type = String(searchParams.get("type") ?? "").trim();
    const source = String(searchParams.get("source") ?? "").trim();
    const status = String(searchParams.get("status") ?? "active").trim();

    const where: Record<string, unknown> = {};
    if (commune) where.commune = { contains: commune, mode: "insensitive" };
    if (type) where.type = type;
    if (source) where.source = source;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const places = await prisma.place.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, { popularityScore: "desc" }],
      take: 200,
    });

    return NextResponse.json({ places });
  } catch (error) {
    console.error("[DalleUp] GET /api/admin/places", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
