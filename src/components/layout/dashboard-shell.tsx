import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/lib/site";

export function DashboardShell({ title, nav, children }: { title: string; nav: { href: string; label: string }[]; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-black/5 bg-dalle-charcoal p-5 text-white lg:block">
        <Link href="/" className="text-2xl font-black text-dalle-orange">{site.name}</Link>
        <p className="mt-2 text-sm text-white/60">{site.slogan}</p>
        <nav className="mt-8 grid gap-2">
          {nav.map((item) => <Link key={item.href} href={item.href} className="rounded-2xl px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white">{item.label}</Link>)}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="sticky top-0 z-20 border-b border-black/5 bg-white/90 px-4 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-2xl font-black text-dalle-charcoal">{title}</h1>
        </div>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
