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
  const pctDiscount = promo.discountPct ? Math.round(input.subtotal * (promo.discountPct / 100)) : 0;
  const amountDiscount = promo.discountAmount ?? 0;
  const discount = Math.max(0, Math.min(input.subtotal, pctDiscount + amountDiscount));
  if (discount <= 0) return null;
  return { code: promo.code, description: promo.description, discount, discountedSubtotal: input.subtotal - discount };
}
