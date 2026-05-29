import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const restaurantId = String(body.restaurantId ?? "").trim();
    const code = String(body.code ?? "").trim().toUpperCase();
    const subtotalAmount = typeof body.subtotalAmount === "number" ? body.subtotalAmount : 0;
    const userId = String(body.userId ?? "").trim() || null;

    if (!restaurantId || !code) {
      return NextResponse.json({ message: "Restaurant et code requis." }, { status: 400 });
    }

    const promo = await prisma.promoCode.findFirst({
      where: {
        code,
        restaurantId,
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        ],
      },
      include: { usages: true },
    });

    if (!promo) {
      return NextResponse.json({ valid: false, message: "Code promo invalide ou expiré." });
    }

    if (promo.usageLimit != null && promo.usages.length >= promo.usageLimit) {
      return NextResponse.json({ valid: false, message: "Ce code promo a atteint sa limite d'utilisation." });
    }

    if (userId && promo.perCustomerLimit != null) {
      const userUsageCount = promo.usages.filter((u) => u.userId === userId).length;
      if (userUsageCount >= promo.perCustomerLimit) {
        return NextResponse.json({ valid: false, message: "Vous avez déjà utilisé ce code promo." });
      }
    }

    if (promo.minOrderAmount != null && subtotalAmount < promo.minOrderAmount) {
      return NextResponse.json({ valid: false, message: `Montant minimum requis : ${promo.minOrderAmount} FCFA.` });
    }

    let discountAmount = 0;
    if (promo.discountType === "PERCENTAGE" && promo.discountValue != null) {
      discountAmount = Math.round((subtotalAmount * promo.discountValue) / 100);
    } else if (promo.discountType === "FIXED_AMOUNT" && promo.discountValue != null) {
      discountAmount = promo.discountValue;
    } else if (promo.discountType === "FREE_DELIVERY") {
      discountAmount = 0;
    }

    if (promo.maxDiscountAmount != null && discountAmount > promo.maxDiscountAmount) {
      discountAmount = promo.maxDiscountAmount;
    }

    if (discountAmount > subtotalAmount) {
      discountAmount = subtotalAmount;
    }

    return NextResponse.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        title: promo.title,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
      },
      discountAmount,
    });
  } catch (error) {
    console.error("[DalleUp] POST /api/promos/validate", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
