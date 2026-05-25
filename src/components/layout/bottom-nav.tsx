"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";
import { useMobileDrawer } from "@/hooks/use-mobile-drawer";

const items = [
  { href: "/app", label: "Accueil", icon: Home },
  { href: "/app/restaurants", label: "Recherche", icon: Search },
  { href: "/app/cart", label: "Panier", icon: ShoppingBag },
  { href: "/app/orders", label: "Commandes", icon: ReceiptText },
  { href: "/app/profile", label: "Profil", icon: User }
];

export function BottomNav() {
  const { itemsCount } = useCart();
  const pathname = usePathname();
  const { isOpen } = useMobileDrawer();
  if (isOpen) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-transparent px-2 pb-2 md:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      <div className="grid grid-cols-5 gap-1 rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const showCount = item.href === "/app/cart" && itemsCount > 0;
          return (
            <Link key={item.href} href={item.href} aria-label={item.label} className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition ${active ? "bg-dalle-orange text-white" : "text-neutral-500 hover:bg-dalle-orange hover:text-white"}`}>
              <Icon size={18} />
              {showCount ? <span className="absolute right-0 top-0 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-dalle-lime px-0.5 text-[9px] font-black text-dalle-charcoal">{itemsCount}</span> : null}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
