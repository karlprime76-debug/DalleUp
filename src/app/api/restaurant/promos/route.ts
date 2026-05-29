import { NextResponse } from "next/server";
import { requireRestaurantApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getPlanFeatures, getActiveRestaurantSubscription } from "@/lib/restaurant/subscriptions";

export async function GET() {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;

    const promos = await prisma.promoCode.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { usages: true } } },
    });

    return NextResponse.json({ promos: promos.map((p) => ({ ...p, usageCount: p._count.usages })) });
  } catch (error) {
    console.error("[DalleUp] GET /api/restaurant/promos", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireRestaurantApi();
    if ("response" in result) return result.response;
    const { restaurant } = result;

    const sub = await getActiveRestaurantSubscription(restaurant.id);
    const features = getPlanFeatures(sub?.plan ?? null);
    if (!features.allowPromoCodes) {
      return NextResponse.json({ message: "Les codes promo ne sont pas disponibles avec votre plan actuel." }, { status: 403 });
    }

    const activeCount = await prisma.promoCode.count({
      where: { restaurantId: restaurant.id, isActive: true },
    });
    if (activeCount >= features.maxActivePromoCodes) {
      return NextResponse.json({ message: `Limite de ${features.maxActivePromoCodes} codes promo actifs atteinte.` }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const code = String(body.code ?? "").trim().toUpperCase();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim() || null;
    const discountType = body.discountType === "PERCENTAGE" || body.discountType === "FIXED_AMOUNT" || body.discountType === "FREE_DELIVERY" ? body.discountType : null;
    const discountValue = typeof body.discountValue === "number" ? Math.max(0, body.discountValue) : null;
    const minOrderAmount = typeof body.minOrderAmount === "number" ? Math.max(0, body.minOrderAmount) : null;
    const maxDiscountAmount = typeof body.maxDiscountAmount === "number" ? Math.max(0, body.maxDiscountAmount) : null;
    const usageLimit = typeof body.usageLimit === "number" ? Math.max(1, body.usageLimit) : null;
    const perCustomerLimit = typeof body.perCustomerLimit === "number" ? Math.max(1, body.perCustomerLimit) : null;
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const endsAt = body.endsAt ? new Date(body.endsAt) : null;
    const isActive = body.isActive !== false;

    if (!code || code.length < 3) {
      return NextResponse.json({ message: "Code promo requis (min 3 caractères)." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ message: "Titre requis." }, { status: 400 });
    }
    if (!discountType) {
      return NextResponse.json({ message: "Type de réduction requis." }, { status: 400 });
    }
    if (discountType === "PERCENTAGE" && (discountValue == null || discountValue > 80)) {
      return NextResponse.json({ message: "Réduction percentage max 80%." }, { status: 400 });
    }
    if (discountType !== "FREE_DELIVERY" && discountValue == null) {
      return NextResponse.json({ message: "Valeur de réduction requise." }, { status: 400 });
    }

    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ message: "Ce code promo existe déjà." }, { status: 409 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        restaurantId: restaurant.id,
        code,
        title,
        description,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        perCustomerLimit,
        startsAt,
        endsAt,
        isActive,
      },
    });

    return NextResponse.json({ ok: true, promo });
  } catch (error) {
    console.error("[DalleUp] POST /api/restaurant/promos", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
