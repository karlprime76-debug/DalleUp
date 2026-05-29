import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/guards";
import { resolvePayoutProvider, createPayout } from "@/lib/payouts/provider";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const body = await request.json().catch(() => ({}));
    const orderId = String(body.orderId ?? "").trim();

    const whereClause: import("@prisma/client").Prisma.OrderWhereInput = orderId
      ? { id: orderId, status: "DELIVERED" as import("@prisma/client").OrderStatus, paymentStatus: "PAID" as import("@prisma/client").PaymentStatus, payoutStatus: null }
      : { status: "DELIVERED" as import("@prisma/client").OrderStatus, paymentStatus: "PAID" as import("@prisma/client").PaymentStatus, payoutStatus: null };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { orderSplit: true, payment: true, restaurant: true, delivery: true },
      take: 50,
    });

    const provider = resolvePayoutProvider();
    const results: unknown[] = [];

    for (const order of orders) {
      if (!order.orderSplit) continue;
      if (order.orderSplit.status !== "READY_TO_PAY" && order.orderSplit.status !== "PENDING") continue;

      const existingTransfers = await prisma.payoutTransfer.findMany({ where: { orderId: order.id } });
      const restaurantTransfer = existingTransfers.find((t) => t.beneficiaryType === "RESTAURANT");
      const courierTransfer = existingTransfers.find((t) => t.beneficiaryType === "COURIER");

      const transfersToProcess: { type: "RESTAURANT" | "COURIER"; beneficiaryId: string; amount: number }[] = [];

      if (!restaurantTransfer || (restaurantTransfer.status !== "SUCCESS" && restaurantTransfer.status !== "MANUALLY_PAID")) {
        transfersToProcess.push({ type: "RESTAURANT", beneficiaryId: order.restaurant.ownerId, amount: order.orderSplit.restaurantAmount });
      }
      if (order.delivery?.driverId && (!courierTransfer || (courierTransfer.status !== "SUCCESS" && courierTransfer.status !== "MANUALLY_PAID"))) {
        transfersToProcess.push({ type: "COURIER", beneficiaryId: order.delivery.driverId, amount: order.orderSplit.courierAmount });
      }

      const orderResults: unknown[] = [];
      for (const t of transfersToProcess) {
        const account = await prisma.payoutAccount.findFirst({
          where: { ownerType: t.type, ownerId: t.beneficiaryId },
          orderBy: { createdAt: "desc" },
        });

        if (!account) {
          await prisma.payoutTransfer.upsert({
            where: { orderId_beneficiaryType_beneficiaryId: { orderId: order.id, beneficiaryType: t.type, beneficiaryId: t.beneficiaryId } },
            create: { orderId: order.id, beneficiaryType: t.type, beneficiaryId: t.beneficiaryId, amount: t.amount, currency: "XOF", provider, status: "BLOCKED_MISSING_PAYOUT_ACCOUNT" },
            update: { status: "BLOCKED_MISSING_PAYOUT_ACCOUNT" },
          });
          orderResults.push({ type: t.type, ok: false, error: "Compte payout absent." });
          continue;
        }

        if (!account.isVerified || account.rejectedAt) {
          await prisma.payoutTransfer.upsert({
            where: { orderId_beneficiaryType_beneficiaryId: { orderId: order.id, beneficiaryType: t.type, beneficiaryId: t.beneficiaryId } },
            create: { orderId: order.id, beneficiaryType: t.type, beneficiaryId: t.beneficiaryId, payoutAccountId: account.id, amount: t.amount, currency: "XOF", provider, status: "BLOCKED_UNVERIFIED_PAYOUT_ACCOUNT" },
            update: { status: "BLOCKED_UNVERIFIED_PAYOUT_ACCOUNT" },
          });
          orderResults.push({ type: t.type, ok: false, error: "Compte payout non vérifié ou rejeté." });
          continue;
        }

        const transfer = await prisma.payoutTransfer.upsert({
          where: {
            orderId_beneficiaryType_beneficiaryId: {
              orderId: order.id,
              beneficiaryType: t.type,
              beneficiaryId: t.beneficiaryId,
            },
          },
          create: {
            orderId: order.id,
            beneficiaryType: t.type,
            beneficiaryId: t.beneficiaryId,
            payoutAccountId: account.id,
            amount: t.amount,
            currency: "XOF",
            provider,
            status: "PROCESSING",
          },
          update: { status: "PROCESSING", attempts: { increment: 1 } },
        });

        const payoutResult = await createPayout(provider, {
          amount: t.amount,
          currency: "XOF",
          beneficiaryType: t.type,
          beneficiaryId: t.beneficiaryId,
          phone: account.phone ?? undefined,
          accountAlias: account.accountAlias ?? undefined,
          accountName: account.accountName ?? undefined,
          reference: transfer.id,
        });

        if (payoutResult.ok) {
          await prisma.payoutTransfer.update({
            where: { id: transfer.id },
            data: { status: "SUCCESS", providerRef: payoutResult.providerRef, processedAt: new Date(), raw: payoutResult.raw as unknown as Parameters<typeof prisma.payoutTransfer.update>[0]["data"]["raw"] },
          });
        } else {
          await prisma.payoutTransfer.update({
            where: { id: transfer.id },
            data: { status: transfer.attempts >= 2 ? "RETRY_REQUIRED" : "FAILED", lastError: payoutResult.error, raw: payoutResult.raw as unknown as Parameters<typeof prisma.payoutTransfer.update>[0]["data"]["raw"] },
          });
        }

        orderResults.push({ type: t.type, ok: payoutResult.ok, error: payoutResult.error });
      }

      // Vérifier si tous les payouts sont SUCCESS ou MANUALLY_PAID
      const finalTransfers = await prisma.payoutTransfer.findMany({ where: { orderId: order.id } });
      const allSuccess = finalTransfers.length > 0 && finalTransfers.every((t) => t.status === "SUCCESS" || t.status === "MANUALLY_PAID");
      const anyFailed = finalTransfers.some((t) => t.status === "FAILED" || t.status === "RETRY_REQUIRED");

      if (allSuccess) {
        await prisma.$transaction([
          prisma.order.update({ where: { id: order.id }, data: { payoutStatus: "SUCCESS", updatedAt: new Date() } }),
          prisma.orderSplit.update({ where: { orderId: order.id }, data: { status: "SUCCESS" } }),
        ]);
      } else if (anyFailed) {
        await prisma.order.update({ where: { id: order.id }, data: { payoutStatus: "RETRY_REQUIRED", updatedAt: new Date() } });
      }

      results.push({ orderId: order.id, payouts: orderResults, allSuccess, anyFailed });
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (error) {
    console.error("[DalleUp payouts/process] error", error);
    return NextResponse.json({ ok: false, error: "Indisponible." }, { status: 503 });
  }
}
