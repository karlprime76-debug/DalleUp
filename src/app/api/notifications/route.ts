import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getNotifications, markNotificationsAsRead } from "@/lib/data/notifications";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const data = await getNotifications(session.user.id, { unreadOnly, page, limit });
    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[notifications] GET", error);
    return NextResponse.json({ message: "Notifications indisponibles." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : undefined;
    const ok = await markNotificationsAsRead(session.user.id, ids);
    return NextResponse.json({ success: ok });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[notifications] PATCH", error);
    return NextResponse.json({ message: "Impossible de marquer comme lu." }, { status: 503 });
  }
}
