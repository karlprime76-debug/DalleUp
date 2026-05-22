import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    }

    const payouts = await prisma.payout.findMany({
      orderBy: { requestedAt: "desc" },
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
