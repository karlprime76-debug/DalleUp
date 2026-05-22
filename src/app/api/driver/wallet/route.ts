import { NextResponse } from "next/server";
import { requireApprovedDriverApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const result = await requireApprovedDriverApi();
    if ("response" in result) return result.response;

    const wallet = await prisma.wallet.findUnique({
      where: { userId: result.session.user.id },
      include: {
        entries: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    return NextResponse.json({
      balance: wallet?.balance ?? 0,
      pendingBalance: wallet?.pendingBalance ?? 0,
      currency: wallet?.currency ?? "XOF",
      entries: wallet?.entries ?? [],
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp] GET /api/driver/wallet", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
