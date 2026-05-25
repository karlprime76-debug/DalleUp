"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { useMobileDrawer } from "@/hooks/use-mobile-drawer";

export type NavSection = { title: string; items: { href: string; label: string }[] };

export function DashboardShell({
  title,
  nav,
  sections,
  children,
  logoHref = "/",
  publicHref = "/"
}: {
  title: string;
  nav?: { href: string; label: string }[];
  sections?: NavSection[];
  children: ReactNode;
  logoHref?: string;
  publicHref?: string;
}) {
  const { isOpen: mobileOpen, setIsOpen: setMobileOpen } = useMobileDrawer();
  const pathname = usePathname();
  const allItems = sections ? sections.flatMap((s) => s.items) : nav ?? [];

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen, setMobileOpen]);

  const renderLink = (item: { href: string; label: string }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${active ? "bg-dalle-orange text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-black/5 bg-dalle-charcoal p-5 text-white lg:flex">
        <Link href={logoHref} aria-label="Retour au tableau de bord" className="text-2xl font-black text-dalle-orange">{site.name}</Link>
        <p className="mt-2 text-sm text-white/60">{site.slogan}</p>
        <nav className="mt-6 flex-1 overflow-y-auto pb-4">
          {sections ? (
            <div className="grid gap-6">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="px-4 text-xs font-black uppercase tracking-wide text-white/40">{section.title}</p>
                  <div className="mt-2 grid gap-1">{section.items.map(renderLink)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-1">{allItems.map(renderLink)}</div>
          )}
        </nav>
        <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
          <Link href={publicHref} className="rounded-2xl px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">Accueil public</Link>
          <Link href="/app/profile" className="rounded-2xl px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">Mon profil</Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white"><LogOut size={16} className="mr-2 inline" />Se déconnecter</button>
        </div>
      </aside>

      {/* Topbar mobile */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu de navigation" className="grid h-10 w-10 place-items-center rounded-2xl bg-neutral-100 transition hover:bg-neutral-200">
          <Menu size={20} className="text-dalle-charcoal" />
        </button>
        <Link href={logoHref} aria-label="Retour au tableau de bord" className="text-xl font-black text-dalle-orange">{site.name}</Link>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
          role="button"
          tabIndex={mobileOpen ? 0 : -1}
        />
        {/* Panel */}
        <div
          className={`fixed left-0 top-0 z-[60] h-dvh w-[82vw] max-w-[340px] bg-dalle-charcoal p-5 text-white shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between">
            <Link href={logoHref} onClick={() => setMobileOpen(false)} className="text-xl font-black text-dalle-orange">{site.name}</Link>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu de navigation" className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 transition hover:bg-white/20">
              <X size={20} />
            </button>
          </div>
          <nav className="mt-6 max-h-[calc(100vh-180px)] overflow-y-auto">
            {sections ? (
              <div className="grid gap-6">
                {sections.map((section) => (
                  <div key={section.title}>
                    <p className="px-4 text-xs font-black uppercase tracking-wide text-white/40">{section.title}</p>
                    <div className="mt-2 grid gap-1">{section.items.map(renderLink)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-1">{allItems.map(renderLink)}</div>
            )}
          </nav>
          <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
            <Link href={publicHref} onClick={() => setMobileOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">Accueil public</Link>
            <Link href="/app/profile" onClick={() => setMobileOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">Mon profil</Link>
            <button type="button" onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }} className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white"><LogOut size={16} className="mr-2 inline" />Se déconnecter</button>
          </div>
        </div>
      </div>

      <main className="lg:pl-64">
        <div className="sticky top-0 z-20 hidden items-center gap-3 border-b border-black/5 bg-white/90 px-8 py-4 backdrop-blur-xl lg:flex">
          <h1 className="text-2xl font-black text-dalle-charcoal">{title}</h1>
        </div>
        <div className="p-4 pb-24 lg:p-8 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
