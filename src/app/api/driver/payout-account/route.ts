import { NextResponse } from "next/server";
import { requireApprovedDriverApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const driver = await requireApprovedDriverApi();
    if ("response" in driver) return driver.response;
    const accounts = await prisma.payoutAccount.findMany({
      where: { ownerType: "COURIER", ownerId: driver.session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[DalleUp] GET /api/driver/payout-account", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const driver = await requireApprovedDriverApi();
    if ("response" in driver) return driver.response;
    const body = await request.json().catch(() => ({}));
    const method = String(body.method ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const accountName = String(body.accountName ?? "").trim();
    const accountAlias = String(body.accountAlias ?? "").trim();
    if (!method || !phone || !accountName) {
      return NextResponse.json({ message: "Méthode, téléphone et nom du titulaire requis." }, { status: 400 });
    }
    const existing = await prisma.payoutAccount.findUnique({
      where: { ownerType_ownerId_provider_method: { ownerType: "COURIER", ownerId: driver.session.user.id, provider: "MANUAL", method } },
    });
    if (existing) {
      const updated = await prisma.payoutAccount.update({
        where: { id: existing.id },
        data: { phone, accountName, accountAlias, isVerified: false, verifiedAt: null, rejectedAt: null, rejectionReason: null },
      });
      return NextResponse.json({ account: updated });
    }
    const created = await prisma.payoutAccount.create({
      data: { ownerType: "COURIER", ownerId: driver.session.user.id, provider: "MANUAL", method, phone, accountName, accountAlias: accountAlias || undefined },
    });
    return NextResponse.json({ account: created }, { status: 201 });
  } catch (error) {
    console.error("[DalleUp] POST /api/driver/payout-account", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
