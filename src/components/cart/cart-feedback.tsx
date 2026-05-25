"use client";

import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";

export function CartFeedback() {
  const { message } = useCart();
  if (!message) return null;
  return <div className="fixed left-4 right-4 top-20 z-30 mx-auto flex max-w-sm items-center gap-2 rounded-3xl bg-dalle-charcoal px-4 py-3 text-sm font-black text-white shadow-2xl"><CheckCircle2 className="text-dalle-lime" size={20} />{message}</div>;
}
