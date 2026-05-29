import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/guards";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const body = await request.json().catch(() => ({}));
    const transferId = String(body.transferId ?? "").trim();
    const note = String(body.note ?? "").trim();
    if (!transferId) return NextResponse.json({ ok: false, error: "transferId requis." }, { status: 400 });
    if (!note) return NextResponse.json({ ok: false, error: "Note admin requise." }, { status: 400 });

    const transfer = await prisma.payoutTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return NextResponse.json({ ok: false, error: "Reversement introuvable." }, { status: 404 });
    if (transfer.status === "SUCCESS" || transfer.status === "MANUALLY_PAID") {
      return NextResponse.json({ ok: false, error: "Reversement déjà finalisé." }, { status: 400 });
    }

    await prisma.payoutTransfer.update({
      where: { id: transfer.id },
      data: {
        status: "MANUALLY_PAID",
        processedAt: new Date(),
        lastError: note,
      },
    });

    // Recalculer le statut global de la commande
    const finalTransfers = await prisma.payoutTransfer.findMany({ where: { orderId: transfer.orderId } });
    const allSuccess = finalTransfers.length > 0 && finalTransfers.every((t) => t.status === "SUCCESS" || t.status === "MANUALLY_PAID");
    const anyFailed = finalTransfers.some((t) => t.status === "FAILED" || t.status === "RETRY_REQUIRED");

    if (allSuccess) {
      await prisma.$transaction([
        prisma.order.update({ where: { id: transfer.orderId }, data: { payoutStatus: "SUCCESS", updatedAt: new Date() } }),
        prisma.orderSplit.update({ where: { orderId: transfer.orderId }, data: { status: "SUCCESS" } }),
      ]);
    } else if (anyFailed) {
      await prisma.order.update({ where: { id: transfer.orderId }, data: { payoutStatus: "RETRY_REQUIRED", updatedAt: new Date() } });
    }

    return NextResponse.json({ ok: true, transferId, status: "MANUALLY_PAID" });
  } catch (error) {
    console.error("[DalleUp payouts/manual-mark-paid] error", error);
    return NextResponse.json({ ok: false, error: "Indisponible." }, { status: 503 });
  }
}
