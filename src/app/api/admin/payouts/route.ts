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

    const payouts = await prisma.payout.findMany({
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

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

    return NextResponse.json({ payouts: payoutsWithUser });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp] GET /api/admin/payouts", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
