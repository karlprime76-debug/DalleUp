"use client";

import Link from "next/link";
import { Home, Truck, Wallet, User } from "lucide-react";

const items = [
  { href: "/driver/dashboard", label: "Dashboard", icon: Home },
  { href: "/driver/deliveries", label: "Livraisons", icon: Truck },
  { href: "/driver/earnings", label: "Gains", icon: Wallet },
  { href: "/driver/profile", label: "Profil", icon: User }
];

export function BottomNavDriver() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-transparent px-3 pb-3 md:hidden">
      <div className="grid grid-cols-4 gap-1 rounded-[1.75rem] border border-black/10 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-neutral-500 transition hover:bg-dalle-orange hover:text-white"
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
