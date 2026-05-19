import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-black text-dalle-charcoal">
          <Image src="/brand/dalleup-icon.svg" alt={`${site.name} logo`} width={42} height={42} className="rounded-2xl shadow-sm" priority />
          <Image src="/brand/dalleup-logo-slogan.svg" alt={`${site.name} - ${site.slogan}`} width={170} height={96} className="hidden h-12 w-auto sm:block" priority />
          <span className="sr-only">{site.name}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-bold text-neutral-600 md:flex">
          <Link href="/restaurants">Restaurants</Link>
          <Link href="/about">À propos</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden text-sm font-bold text-neutral-700 sm:block">Connexion</Link>
          <ButtonLink href="/app" className="px-4 py-2">Commander</ButtonLink>
        </div>
      </div>
    </header>
  );
}
