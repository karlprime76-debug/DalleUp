import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DELIVERY_DRIVER") {
      return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
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
