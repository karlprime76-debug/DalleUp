"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";

export function AppHeader() {
  const { itemsCount } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-dalle-cream/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/app" aria-label="Retour à l'accueil client" className="flex items-center gap-3">
          <Image src="/brand/dalleup-icon.svg" alt="DalleUp" width={42} height={42} className="rounded-2xl shadow-sm" priority />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-dalle-orange">Commande. Chill. On livre.</p>
            <div className="mt-1 flex items-center gap-1 text-sm font-bold text-neutral-600"><MapPin size={15} /> Cotonou Centre</div>
          </div>
        </Link>
        <Link href="/app/cart" aria-label="Panier" className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-dalle-charcoal text-white shadow-sm transition hover:bg-black">
          <ShoppingBag size={22} />
          {itemsCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-dalle-lime px-1 text-[11px] font-black text-dalle-charcoal">{itemsCount}</span> : null}
        </Link>
      </div>
    </header>
  );
}
