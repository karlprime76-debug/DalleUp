import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { getBillingNotifications } from "@/lib/data/billing-notifications";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminApi(request);
    if ("response" in admin) return admin.response;
    const notifications = await getBillingNotifications();
    return NextResponse.json({ notifications });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp admin notifications fallback] list", error);
    return NextResponse.json({ message: "Notifications indisponibles." }, { status: 503 });
  }
}
