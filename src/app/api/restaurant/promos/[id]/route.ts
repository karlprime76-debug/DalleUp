import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;
    const { id } = await params;

    const promo = await prisma.promoCode.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!promo) return NextResponse.json({ message: "Code promo introuvable." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const updateData: Record<string, unknown> = {};
    if (typeof body.title === "string") updateData.title = body.title.trim();
    if (typeof body.description === "string") updateData.description = body.description.trim() || null;
    if (body.discountType === "PERCENTAGE" || body.discountType === "FIXED_AMOUNT" || body.discountType === "FREE_DELIVERY") updateData.discountType = body.discountType;
    if (typeof body.discountValue === "number") updateData.discountValue = Math.max(0, body.discountValue);
    if (typeof body.minOrderAmount === "number") updateData.minOrderAmount = Math.max(0, body.minOrderAmount);
    if (typeof body.maxDiscountAmount === "number") updateData.maxDiscountAmount = Math.max(0, body.maxDiscountAmount);
    if (typeof body.usageLimit === "number") updateData.usageLimit = Math.max(1, body.usageLimit);
    if (typeof body.perCustomerLimit === "number") updateData.perCustomerLimit = Math.max(1, body.perCustomerLimit);
    if (body.startsAt) updateData.startsAt = new Date(body.startsAt);
    if (body.endsAt) updateData.endsAt = new Date(body.endsAt);
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    const updated = await prisma.promoCode.update({ where: { id: promo.id }, data: updateData });
    return NextResponse.json({ ok: true, promo: updated });
  } catch (error) {
    console.error("[DalleUp] PATCH /api/restaurant/promos/[id]", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;
    const { id } = await params;

    const promo = await prisma.promoCode.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!promo) return NextResponse.json({ message: "Code promo introuvable." }, { status: 404 });

    await prisma.promoCode.update({ where: { id: promo.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, message: "Code promo désactivé." });
  } catch (error) {
    console.error("[DalleUp] DELETE /api/restaurant/promos/[id]", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
