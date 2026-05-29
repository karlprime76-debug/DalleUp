import { ArrowRight, Bike, Building2, Clock, Flame, MapPin, ShieldCheck, Sparkles, Star, Utensils } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { RestaurantCard } from "@/components/customer/restaurant-card";
import { TrendingDishCard } from "@/components/customer/trending-dish-card";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/config";
import { getDashboardPathByRole, type UserRole } from "@/lib/auth/roles";
import { getPopularRestaurants, getTrendingMenuItems } from "@/lib/data/restaurants";
import { site } from "@/lib/site";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as UserRole | undefined;
  const dashboardHref = getDashboardPathByRole(role);
  const isLoggedIn = !!session?.user;
  const [popularRestaurants, trendingItems] = await Promise.all([getPopularRestaurants(), getTrendingMenuItems()]);

  const steps = [
    { icon: Utensils, title: "Choisissez votre envie", text: "Pizza, grillades, burger ou plat béninois : filtrez et commandez." },
    { icon: Sparkles, title: "Validez en 2 clics", text: "Panier clair, frais visibles, paiement sécurisé." },
    { icon: Bike, title: "On s'occupe de la livraison", text: "Suivez votre commande jusqu'à votre porte avec une timeline simple." }
  ];

  return (
    <>
      <SiteHeader />
      <main className="bg-dalle-cream">
        <section className="relative overflow-hidden bg-dalle-charcoal text-white">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-dalle-orange/30 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-dalle-lime/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
            <div className="flex flex-col justify-center">
              <Badge variant="lime" className="w-fit"><Flame size={14} /> Food delivery nouvelle génération</Badge>
              <Image src="/brand/dalleup-logo-slogan.svg" alt={`${site.name} - ${site.slogan}`} width={430} height={242} className="mt-6 h-auto w-full max-w-md rounded-[2rem] bg-white p-4 shadow-2xl" priority />
              {isLoggedIn ? (
                <>
                  <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">Bon retour sur DalleUp</h1>
                  <p className="mt-4 text-3xl font-black text-dalle-orange md:text-5xl">{session.user.name ? `Heureux de te revoir, ${session.user.name} !` : "Heureux de te revoir !"}</p>
                  <p className="mt-6 max-w-xl text-lg text-white/70">Retrouve tes restaurants préférés, tes commandes et ton tableau de bord en un clic.</p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href={dashboardHref} size="lg">Aller à mon tableau de bord <ArrowRight size={18} /></ButtonLink>
                    <ButtonLink href="/app/restaurants" variant="ghost" size="lg">Voir les restaurants</ButtonLink>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href="/app/orders" variant="secondary" size="lg">Mes commandes</ButtonLink>
                    <ButtonLink href="/app/profile" variant="ghost" size="lg">Mon profil</ButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">T&apos;as la dalle ?</h1>
                  <p className="mt-4 text-3xl font-black text-dalle-orange md:text-5xl">Commande. Chill. On livre.</p>
                  <p className="mt-6 max-w-xl text-lg text-white/70">{site.name} transforme la commande repas en vraie expérience mobile : rapide, fun, claire et locale.</p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href="/app" size="lg">Commander en tant que client <ArrowRight size={18} /></ButtonLink>
                    <ButtonLink href="/login" variant="ghost" size="lg">Se connecter</ButtonLink>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href="/register" variant="secondary" size="lg">Créer un compte client</ButtonLink>
                    <ButtonLink href="/register?role=RESTAURANT" variant="ghost" size="lg">Devenir restaurant partenaire</ButtonLink>
                    <ButtonLink href="/register?role=DELIVERY_DRIVER" variant="ghost" size="lg">Devenir livreur DalleUp</ButtonLink>
                  </div>
                </>
              )}
            </div>
            <div className="relative min-h-[470px]">
              <div className="absolute inset-x-6 top-4 rotate-3 rounded-[2.5rem] bg-dalle-orange p-4 shadow-glow">
                <div className="h-64 rounded-[2rem] bg-dalle-charcoal bg-[url('/brand/dalleup-icon.svg')] bg-cover bg-center bg-no-repeat" />
                <div className="mt-4 rounded-[2rem] bg-white p-4 text-dalle-charcoal">
                  <div className="flex items-center justify-between"><h3 className="text-xl font-black">Votre restaurant prefere</h3><span className="flex items-center gap-1 font-black text-dalle-orange"><Star size={16} fill="currentColor" />4.8</span></div>
                  <p className="text-sm text-neutral-500">Decouvrez les meilleurs plats de Cotonou</p>
                </div>
              </div>
              <div className="absolute bottom-2 left-0 right-10 rounded-[2rem] bg-white p-5 text-dalle-charcoal shadow-2xl">
                <p className="text-sm font-black text-dalle-orange">Livraison express</p>
                <h3 className="mt-1 text-2xl font-black">Commandez en 2 clics</h3>
                <div className="mt-4 h-3 rounded-full bg-neutral-100"><div className="h-3 w-3/4 rounded-full bg-dalle-orange" /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-4 md:grid-cols-3">{steps.map((step) => <Card key={step.title} className="p-6"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-dalle-orange"><step.icon size={24} /></div><h2 className="mt-5 text-xl font-black">{step.title}</h2><p className="mt-2 text-neutral-500">{step.text}</p></Card>)}</div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex items-end justify-between gap-4"><div><Badge>Populaires</Badge><h2 className="mt-3 text-3xl font-black">Restaurants qui buzzent</h2></div><ButtonLink href="/restaurants" variant="dark">Voir tout</ButtonLink></div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">{popularRestaurants.slice(0, 3).map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} hrefPrefix="/restaurants" />)}</div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex items-center justify-between"><h2 className="text-3xl font-black">Plats tendances</h2><Badge variant="lime"><Flame size={14} /> Hot</Badge></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{trendingItems.slice(0, 8).map((item) => <TrendingDishCard key={item.id} item={item} />)}</div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 md:grid-cols-3">
          {[{ icon: Clock, title: "Rapide", text: "Des parcours courts, pensés pour le mobile." }, { icon: ShieldCheck, title: "Pro", text: "Statuts, paiements et rôles gérés professionnellement." }, { icon: MapPin, title: "Local", text: "Zones et frais de livraison adaptés à votre localisation." }].map((item) => <Card key={item.title} className="p-6"><item.icon className="text-dalle-orange" /><h3 className="mt-4 text-xl font-black">{item.title}</h3><p className="mt-2 text-neutral-500">{item.text}</p></Card>)}
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 md:grid-cols-2">
          <Card className="bg-dalle-charcoal p-8 text-white"><Building2 className="text-dalle-lime" /><h2 className="mt-4 text-3xl font-black">Restaurants partenaires</h2><p className="mt-3 text-white/70">Recevez plus de commandes, gérez votre menu et suivez vos ventes simplement.</p>{isLoggedIn ? <ButtonLink href="/partners" className="mt-6" variant="secondary">Découvrir le programme</ButtonLink> : <ButtonLink href="/register?role=RESTAURANT" className="mt-6" variant="secondary">Rejoindre DalleUp</ButtonLink>}</Card>
          <Card className="p-8"><Bike className="text-dalle-orange" /><h2 className="mt-4 text-3xl font-black">Livreurs DalleUp</h2><p className="mt-3 text-neutral-500">Livraisons assignées, statuts clairs, historique et gains dans un espace dédié.</p>{isLoggedIn ? <ButtonLink href="/delivery" className="mt-6" variant="dark">En savoir plus</ButtonLink> : <ButtonLink href="/register?role=DELIVERY_DRIVER" className="mt-6" variant="dark">Devenir livreur</ButtonLink>}</Card>
        </section>

        <footer className="mt-10 bg-dalle-charcoal px-4 py-10 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <Image src="/brand/dalleup-logo-slogan.svg" alt={`${site.name} - ${site.slogan}`} width={210} height={118} className="h-auto w-48 rounded-2xl bg-white p-2" />
                <p className="mt-3 text-white/60">Commandez vos repas préférés au Bénin. Livraison rapide et suivie.</p>
              </div>
              <div>
                <h3 className="font-black">Liens utiles</h3>
                <div className="mt-3 grid gap-2 text-sm text-white/70">
                  <Link href="/restaurants" className="hover:text-dalle-orange">Restaurants</Link>
                  <Link href="/about" className="hover:text-dalle-orange">À propos</Link>
                  <Link href="/contact" className="hover:text-dalle-orange">Contact</Link>
                  <Link href="/faq" className="hover:text-dalle-orange">FAQ</Link>
                </div>
              </div>
              <div>
                <h3 className="font-black">Professionnels</h3>
                <div className="mt-3 grid gap-2 text-sm text-white/70">
                  <Link href="/register?role=RESTAURANT" className="hover:text-dalle-orange">Devenir restaurant partenaire</Link>
                  <Link href="/register?role=DELIVERY_DRIVER" className="hover:text-dalle-orange">Devenir livreur</Link>
                  <Link href="/partners" className="hover:text-dalle-orange">Nos partenaires</Link>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/40">
              &copy; {new Date().getFullYear()} {site.name} — Tous droits réservés.
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
