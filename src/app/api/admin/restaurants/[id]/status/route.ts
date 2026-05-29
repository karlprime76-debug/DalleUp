import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import { requireAdminApi } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/data/admin-audit";
import { createNotification } from "@/lib/data/notifications";
import { prisma } from "@/lib/db/prisma";

const allowedStatuses = ["PENDING", "APPROVED", "SUSPENDED", "CLOSED"] as const;

function safeError(error: unknown) {
  const e = error instanceof Error ? error : new Error(String(error));
  return { name: e.name, message: e.message, code: (error as { code?: string }).code ?? null };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const { id } = await params;

  try {
    // Phase 1 — authentification robuste : getServerSession + fallback getToken
    let adminId: string | null = null;
    let adminRole: string | null = null;

    const admin = await requireAdminApi(request);
    if ("response" in admin) {
      // Fallback JWT token si getServerSession échoue dans l’API route App Router
      const token = await getToken({ req: request as unknown as Parameters<typeof getToken>[0]["req"], secret: process.env.NEXTAUTH_SECRET });
      if (!token?.sub) {
        console.warn("[DalleUp admin restaurant status] auth failed — no session and no JWT token", { id });
        return admin.response;
      }
      adminId = token.sub;
      adminRole = token.role as string;
      if (adminRole !== "ADMIN") {
        return NextResponse.json({ ok: false, error: "Accès admin requis." }, { status: 403 });
      }
    } else {
      adminId = admin.session.user.id;
      adminRole = admin.session.user.role;
    }

    console.log("[DalleUp admin restaurant status] start", { adminId, adminRole, restaurantId: id });

    const body = await request.json().catch(() => ({}));
    const status = String(body.status ?? "");
    console.log("[DalleUp admin restaurant status] body", { requestedStatus: status });

    if (!allowedStatuses.includes(status as typeof allowedStatuses[number])) {
      console.warn("[DalleUp admin restaurant status] invalid status", { status });
      return NextResponse.json({ ok: false, error: "Statut restaurant invalide." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!restaurant) {
      console.warn("[DalleUp admin restaurant status] restaurant not found", { id });
      return NextResponse.json({ ok: false, error: "Restaurant introuvable." }, { status: 404 });
    }

    const previousStatus = restaurant.status;
    console.log("[DalleUp admin restaurant status] found restaurant", { restaurantId: restaurant.id, previousStatus });

    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { status: status as typeof allowedStatuses[number] },
    });

    console.log("[DalleUp admin restaurant status] prisma update done", {
      restaurantId: updated.id,
      previousStatus,
      newStatus: updated.status,
      ownerId: updated.ownerId,
    });

    // Vérification explicite que le statut a bien changé
    if (updated.status !== status) {
      console.error("[DalleUp admin restaurant status] CRITICAL — status mismatch after update", {
        restaurantId: updated.id,
        expectedStatus: status,
        actualStatus: updated.status,
      });
      return NextResponse.json({ ok: false, error: "Le statut n’a pas été mis à jour correctement." }, { status: 500 });
    }

    revalidatePath("/restaurant/dashboard");
    revalidatePath("/restaurant/pending");
    revalidatePath(`/restaurants/${updated.slug}`);
    revalidatePath("/admin/approvals");
    revalidatePath("/admin/restaurants");
    revalidatePath("/admin");

    await logAdminAction({
      adminId: adminId!,
      action: "RESTAURANT_STATUS_UPDATED",
      targetType: "RESTAURANT",
      targetId: updated.id,
      targetLabel: updated.name,
      metadata: { previousStatus, status: updated.status },
    });

    const notifType = status === "APPROVED" ? "VALIDATION_APPROVED" : status === "SUSPENDED" ? "VALIDATION_REJECTED" : "SYSTEM";
    const notifTitle = status === "APPROVED" ? "Restaurant approuvé" : status === "SUSPENDED" ? "Restaurant suspendu" : "Mise à jour du statut";
    const notifMessage = status === "APPROVED"
      ? `Votre restaurant "${updated.name}" a été approuvé. Vous pouvez maintenant recevoir des commandes.`
      : status === "SUSPENDED"
        ? `Votre restaurant "${updated.name}" a été suspendu. Contactez le support.`
        : `Le statut de votre restaurant "${updated.name}" est passé à ${status}.`;

    await createNotification({ userId: updated.ownerId, type: notifType, title: notifTitle, message: notifMessage, metadata: { restaurantId: updated.id, status: updated.status } });

    console.log("[DalleUp admin restaurant status] success", {
      restaurantId: updated.id,
      previousStatus,
      newStatus: updated.status,
      ownerId: updated.ownerId,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      ok: true,
      restaurant: updated,
      message: status === "APPROVED" ? "Restaurant approuvé." : status === "SUSPENDED" ? "Restaurant suspendu." : "Statut mis à jour.",
    });
  } catch (error) {
    const { name, message, code } = safeError(error);
    console.error("[DalleUp admin restaurant status] failed", {
      restaurantId: id,
      errorName: name,
      errorMessage: message,
      prismaCode: code,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json({ ok: false, error: "Modification statut restaurant indisponible." }, { status: 503 });
  }
}

