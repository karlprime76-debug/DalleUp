import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const ownerType = searchParams.get("ownerType") as import("@prisma/client").PayoutOwnerType | null;
    const where: import("@prisma/client").Prisma.PayoutAccountWhereInput = {};
    if (status === "verified") where.isVerified = true;
    if (status === "unverified") where.isVerified = false;
    if (status === "rejected") where.rejectedAt = { not: null };
    if (ownerType) where.ownerType = ownerType;
    const accounts = await prisma.payoutAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[DalleUp] GET /api/admin/payout-accounts", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
