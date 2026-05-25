import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const body = await request.json();
    const endpoint = String(body.endpoint ?? "");
    const p256dh = String(body.keys?.p256dh ?? "");
    const auth = String(body.keys?.auth ?? "");

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ message: "Subscription invalide." }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: session.user.id, p256dh, auth },
      create: { userId: session.user.id, endpoint, p256dh, auth },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[push subscribe]", error);
    return NextResponse.json({ message: "Impossible d'enregistrer la subscription." }, { status: 500 });
  }
}
