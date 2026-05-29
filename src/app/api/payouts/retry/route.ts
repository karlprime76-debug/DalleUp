import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/guards";
import { resolvePayoutProvider, createPayout } from "@/lib/payouts/provider";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const body = await request.json().catch(() => ({}));
    const transferId = String(body.transferId ?? "").trim();
    if (!transferId) return NextResponse.json({ ok: false, error: "transferId requis." }, { status: 400 });

    const transfer = await prisma.payoutTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return NextResponse.json({ ok: false, error: "Reversement introuvable." }, { status: 404 });
    if (transfer.status === "SUCCESS" || transfer.status === "MANUALLY_PAID") {
      return NextResponse.json({ ok: false, error: "Reversement déjà finalisé." }, { status: 400 });
    }

    const provider = resolvePayoutProvider();
    const account = transfer.payoutAccountId
      ? await prisma.payoutAccount.findUnique({ where: { id: transfer.payoutAccountId } })
      : null;

    const payoutResult = await createPayout(provider, {
      amount: transfer.amount,
      currency: transfer.currency,
      beneficiaryType: transfer.beneficiaryType,
      beneficiaryId: transfer.beneficiaryId,
      phone: account?.phone ?? undefined,
      accountAlias: account?.accountAlias ?? undefined,
      accountName: account?.accountName ?? undefined,
      reference: transfer.id,
    });

    if (payoutResult.ok) {
      await prisma.payoutTransfer.update({
        where: { id: transfer.id },
        data: {
          status: "SUCCESS",
          providerRef: payoutResult.providerRef,
          processedAt: new Date(),
          attempts: { increment: 1 },
          raw: payoutResult.raw as unknown as Parameters<typeof prisma.payoutTransfer.update>[0]["data"]["raw"],
        },
      });
    } else {
      await prisma.payoutTransfer.update({
        where: { id: transfer.id },
        data: {
          status: transfer.attempts >= 2 ? "RETRY_REQUIRED" : "FAILED",
          lastError: payoutResult.error,
          attempts: { increment: 1 },
          raw: payoutResult.raw as unknown as Parameters<typeof prisma.payoutTransfer.update>[0]["data"]["raw"],
        },
      });
    }

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

    return NextResponse.json({ ok: payoutResult.ok, transferId, status: payoutResult.ok ? "SUCCESS" : transfer.attempts >= 2 ? "RETRY_REQUIRED" : "FAILED", error: payoutResult.error });
  } catch (error) {
    console.error("[DalleUp payouts/retry] error", error);
    return NextResponse.json({ ok: false, error: "Indisponible." }, { status: 503 });
  }
}
