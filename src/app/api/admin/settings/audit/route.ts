import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const guard = await requireAdminApi(request);
  if ("response" in guard) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

    const logs = await prisma.adminAuditLog.findMany({
      where: { action: "PLATFORM_SETTINGS_UPDATED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json(
      { message: "Erreur lors du chargement de l'historique." },
      { status: 500 }
    );
  }
}
