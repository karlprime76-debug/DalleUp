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
    if (!endpoint) return NextResponse.json({ message: "Endpoint manquant." }, { status: 400 });

    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[push unsubscribe]", error);
    return NextResponse.json({ message: "Impossible de supprimer la subscription." }, { status: 500 });
  }
}
