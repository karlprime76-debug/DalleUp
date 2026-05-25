"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, CookingPot, Settings, Wallet } from "lucide-react";

const items = [
  { href: "/restaurant/dashboard", label: "Dashboard", icon: Home },
  { href: "/restaurant/orders", label: "Commandes", icon: ReceiptText },
  { href: "/restaurant/menu", label: "Menu", icon: CookingPot },
  { href: "/restaurant/settings", label: "Paramètres", icon: Settings },
  { href: "/restaurant/wallet", label: "Solde", icon: Wallet }
];

export function BottomNavRestaurant() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-transparent px-2 pb-2 md:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      <div className="grid grid-cols-5 gap-1 rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition ${active ? "bg-dalle-orange text-white" : "text-neutral-500 hover:bg-dalle-orange hover:text-white"}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
