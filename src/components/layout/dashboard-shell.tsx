import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { site } from "@/lib/site";

export function DashboardShell({ title, nav, children, logoHref = "/" }: { title: string; nav: { href: string; label: string }[]; children: ReactNode; logoHref?: string }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-black/5 bg-dalle-charcoal p-5 text-white lg:block">
        <Link href={logoHref} aria-label="Retour au tableau de bord" className="text-2xl font-black text-dalle-orange">{site.name}</Link>
        <p className="mt-2 text-sm text-white/60">{site.slogan}</p>
        <nav className="mt-8 grid gap-2">
          {nav.map((item) => <Link key={item.href} href={item.href} className="rounded-2xl px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white">{item.label}</Link>)}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-white/90 px-4 py-4 backdrop-blur-xl lg:px-8">
          <Link href={logoHref} aria-label="Retour" className="grid h-10 w-10 place-items-center rounded-2xl bg-neutral-100 transition hover:bg-neutral-200 lg:hidden"><ArrowLeft size={20} className="text-dalle-charcoal" /></Link>
          <h1 className="text-2xl font-black text-dalle-charcoal">{title}</h1>
        </div>
        <div className="p-4 pb-24 lg:p-8 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
