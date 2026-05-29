import { prisma } from "@/lib/db/prisma";

export type PromoValidationResult = {
  code: string;
  description: string | null;
  discount: number;
  discountedSubtotal: number;
};

export async function validatePromoCode(input: { code?: string | null; subtotal: number; now?: Date }): Promise<PromoValidationResult | null> {
  const code = String(input.code ?? "").trim().toUpperCase();
  if (!code) return null;
  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.isActive) return null;
  const now = input.now ?? new Date();
  if (promo.startsAt && promo.startsAt > now) return null;
  if (promo.endsAt && promo.endsAt < now) return null;
  let discount = 0;
  if (promo.discountType === "PERCENTAGE" && promo.discountValue != null) {
    discount = Math.round(input.subtotal * (promo.discountValue / 100));
  } else if (promo.discountType === "FIXED_AMOUNT" && promo.discountValue != null) {
    discount = promo.discountValue;
  } else if (promo.discountType === "FREE_DELIVERY") {
    discount = 0;
  }
  discount = Math.max(0, Math.min(input.subtotal, discount));
  if (discount <= 0 && promo.discountType !== "FREE_DELIVERY") return null;
  return { code: promo.code, description: promo.description, discount, discountedSubtotal: input.subtotal - discount };
}
