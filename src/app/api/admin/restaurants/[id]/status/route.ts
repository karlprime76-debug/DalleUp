import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/data/admin-audit";
import { prisma } from "@/lib/db/prisma";

const allowedStatuses = ["PENDING", "APPROVED", "SUSPENDED", "CLOSED"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi();
    if ("response" in admin) return admin.response;
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "");
    if (!allowedStatuses.includes(status as typeof allowedStatuses[number])) return NextResponse.json({ message: "Statut restaurant invalide." }, { status: 400 });
    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!restaurant) return NextResponse.json({ message: "Restaurant introuvable." }, { status: 404 });
    const updated = await prisma.restaurant.update({ where: { id: restaurant.id }, data: { status: status as typeof allowedStatuses[number] } });
    await logAdminAction({ adminId: admin.session.user.id, action: "RESTAURANT_STATUS_UPDATED", targetType: "RESTAURANT", targetId: updated.id, targetLabel: updated.name, metadata: { previousStatus: restaurant.status, status } });
    return NextResponse.json({ restaurant: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp admin fallback] restaurant status", error);
    return NextResponse.json({ message: "Modification statut restaurant indisponible." }, { status: 503 });
  }
}

