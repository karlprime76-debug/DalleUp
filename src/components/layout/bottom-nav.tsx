"use client";

import Link from "next/link";
import { Home, ReceiptText, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";

const items = [
  { href: "/app", label: "Accueil", icon: Home },
  { href: "/app/restaurants", label: "Recherche", icon: Search },
  { href: "/app/cart", label: "Panier", icon: ShoppingBag },
  { href: "/app/orders", label: "Commandes", icon: ReceiptText },
  { href: "/app/profile", label: "Profil", icon: User }
];

export function BottomNav() {
  const { itemsCount } = useCart();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-transparent px-3 pb-3 md:hidden">
      <div className="grid grid-cols-5 gap-1 rounded-[1.75rem] border border-black/10 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const showCount = item.href === "/app/cart" && itemsCount > 0;
          return (
            <Link key={item.href} href={item.href} aria-label={item.label} className="relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-neutral-500 transition hover:bg-dalle-orange hover:text-white">
              <Icon size={20} />
              {showCount ? <span className="absolute right-1 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-dalle-lime px-1 text-[10px] text-dalle-charcoal">{itemsCount}</span> : null}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
