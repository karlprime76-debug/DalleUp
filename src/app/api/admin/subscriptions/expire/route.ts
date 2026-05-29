import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { expireRestaurantSubscriptions } from "@/lib/restaurant/subscriptions";

export async function POST(request: Request) {
  try {
    const result = await requireAdminApi(request);
    if ("response" in result) return result.response;

    const { expiredCount } = await expireRestaurantSubscriptions();
    return NextResponse.json({ ok: true, expiredCount });
  } catch (error) {
    console.error("[DalleUp] POST /api/admin/subscriptions/expire", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
