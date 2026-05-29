import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const statusFilter = searchParams.get("status") ?? undefined;

    const where = statusFilter ? { status: statusFilter as import("@prisma/client").PayoutStatus } : {};

    const [payouts, transfers, stats] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payoutTransfer.findMany({
        where: statusFilter ? { status: statusFilter as import("@prisma/client").PayoutStatus } : {},
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { order: { select: { orderNumber: true, restaurantId: true } } },
      }),
      prisma.$queryRaw<[{ totalPaid: number | null; totalPending: number | null; totalFailed: number | null }]> `
        SELECT
          COALESCE(SUM(CASE WHEN status = 'PAID' OR status = 'SUCCESS' OR status = 'MANUALLY_PAID' THEN amount ELSE 0 END), 0)::int as "totalPaid",
          COALESCE(SUM(CASE WHEN status = 'PENDING' OR status = 'READY_TO_PAY' OR status = 'PROCESSING' OR status = 'REQUESTED' THEN amount ELSE 0 END), 0)::int as "totalPending",
          COALESCE(SUM(CASE WHEN status = 'FAILED' OR status = 'RETRY_REQUIRED' THEN amount ELSE 0 END), 0)::int as "totalFailed"
        FROM (
          SELECT amount, status FROM "PayoutTransfer"
          UNION ALL
          SELECT amount, status FROM "Payout"
        ) combined
      `,
    ]);

    const userIds = [...new Set(payouts.map((p) => p.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const payoutsWithUser = payouts.map((p) => ({
      ...p,
      user: userMap.get(p.userId) ?? { id: p.userId, name: null, email: null, role: "" },
    }));

    return NextResponse.json({
      payouts: payoutsWithUser,
      transfers,
      stats: stats[0] ?? { totalPaid: 0, totalPending: 0, totalFailed: 0 },
    });
  } catch (error) {
    console.error("[DalleUp] GET /api/admin/payouts", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
