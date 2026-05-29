import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { authOptions } from "@/lib/auth/config";
import { getDashboardPathByRole, type UserRole } from "@/lib/auth/roles";
import { site } from "@/lib/site";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as UserRole | undefined;
  const logoHref = role ? getDashboardPathByRole(role) : "/";

  const publicNav = [
    { href: "/", label: "Accueil" },
    { href: "/restaurants", label: "Restaurants" },
    { href: "/about", label: "À propos" },
    { href: "/contact", label: "Contact" }
  ];

  const clientNav = [
    { href: "/app", label: "Accueil" },
    { href: "/app/restaurants", label: "Restaurants" },
    { href: "/app/orders", label: "Commandes" },
    { href: "/app/profile", label: "Profil" }
  ];

  const dashboardNav = [
    { href: "/", label: "Accueil public" },
    { href: logoHref, label: "Tableau de bord" }
  ];

  const desktopNav = session?.user
    ? (role === "CLIENT" ? clientNav : dashboardNav)
    : publicNav;

  const mobileNav = session?.user
    ? (role === "CLIENT" ? clientNav : [{ href: logoHref, label: "Tableau de bord" }, { href: "/app/profile", label: "Profil" }])
    : publicNav;

  return (
    <header className="relative sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href={logoHref} aria-label="Retour à l'accueil" className="flex items-center gap-2 font-black text-dalle-charcoal">
          <Image src="/brand/dalleup-icon.svg" alt={`${site.name} logo`} width={42} height={42} className="rounded-2xl shadow-sm" priority />
          <Image src="/brand/dalleup-logo-slogan.svg" alt={`${site.name} - ${site.slogan}`} width={170} height={96} className="hidden h-12 w-auto sm:block" priority />
          <span className="sr-only">{site.name}</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-bold text-neutral-600 md:flex">
          {desktopNav.map((item) => <Link key={item.href} href={item.href} className="rounded-xl px-2 py-1 transition hover:text-dalle-orange">{item.label}</Link>)}
        </nav>
        <MobileNav items={mobileNav} />
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/app/profile" className="hidden text-sm font-bold text-neutral-700 lg:block">Mon profil</Link>
              <SignOutButton className="px-4 py-2" />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm font-bold text-neutral-700 sm:block">Se connecter</Link>
              <ButtonLink href="/register" className="px-4 py-2">Créer un compte</ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
