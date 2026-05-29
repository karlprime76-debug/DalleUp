"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LogOut, MapPin, Menu, ShoppingBag, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useCart } from "@/lib/cart/cart-store";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppHeader() {
  const { itemsCount } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-dalle-cream/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm transition hover:bg-neutral-100"
          >
            <ArrowLeft size={20} className="text-dalle-charcoal" />
          </button>
          <Link href="/app" aria-label="Retour à l'accueil client" className="flex items-center gap-3">
            <Image src="/brand/dalleup-icon.svg" alt="DalleUp" width={42} height={42} className="rounded-2xl shadow-sm" priority />
            <div className="hidden sm:block">
              <p className="text-xs font-black uppercase tracking-wide text-dalle-orange">Commande. Chill. On livre.</p>
              <div className="mt-1 flex items-center gap-1 text-sm font-bold text-neutral-600"><MapPin size={15} /> Cotonou Centre</div>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/app/cart" aria-label="Panier" className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-dalle-charcoal text-white shadow-sm transition hover:bg-black">
            <ShoppingBag size={22} />
            {itemsCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-dalle-lime px-1 text-[11px] font-black text-dalle-charcoal">{itemsCount}</span> : null}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm transition hover:bg-neutral-100 md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/app/profile" aria-label="Mon profil" className="hidden md:grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm transition hover:bg-neutral-100">
            <User size={20} className="text-dalle-charcoal" />
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Se déconnecter"
            className="hidden md:grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm transition hover:bg-neutral-100"
          >
            <LogOut size={20} className="text-dalle-charcoal" />
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div className="absolute inset-x-0 top-full border-b border-black/5 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-xl md:hidden">
          <nav className="grid gap-2">
            <Link href="/app" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-dalle-orange hover:text-white">Accueil</Link>
            <Link href="/app/restaurants" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-dalle-orange hover:text-white">Restaurants</Link>
            <Link href="/app/orders" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-dalle-orange hover:text-white">Commandes</Link>
            <Link href="/app/profile" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-dalle-orange hover:text-white">Mon profil</Link>
            <button type="button" onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }} className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50">Se déconnecter</button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
