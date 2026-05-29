import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = String(body.reason ?? "").trim();
    const account = await prisma.payoutAccount.update({
      where: { id },
      data: { isVerified: false, verifiedAt: null, rejectedAt: new Date(), rejectionReason: reason || null },
    });
    return NextResponse.json({ account });
  } catch (error) {
    console.error("[DalleUp] POST /api/admin/payout-accounts/[id]/reject", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
