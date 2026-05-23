import { getServerSession } from "next-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/config";
import { getDashboardPathByRole, type UserRole } from "@/lib/auth/roles";

export default async function PartnersPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as UserRole | undefined;
  const isLoggedIn = !!session?.user;
  return <><SiteHeader /><main className="min-h-screen bg-dalle-cream px-4 py-16"><div className="mx-auto max-w-5xl"><p className="font-black text-dalle-orange">Restaurants partenaires</p><h1 className="mt-2 text-4xl font-black text-dalle-charcoal md:text-5xl">Vendez plus avec DalleUp</h1><p className="mt-4 max-w-3xl text-neutral-600">DalleUp aide les restaurants de Cotonou à présenter leur menu, recevoir des commandes et organiser leur livraison.</p><div className="mt-8 grid gap-5 md:grid-cols-3"><Card className="p-6"><h2 className="font-black">Visibilité locale</h2><p className="mt-3 text-sm text-neutral-600">Votre restaurant est accessible depuis une expérience mobile simple.</p></Card><Card className="p-6"><h2 className="font-black">Menu digital</h2><p className="mt-3 text-sm text-neutral-600">Mettez en avant vos plats, prix, catégories et disponibilités.</p></Card><Card className="p-6"><h2 className="font-black">Commandes suivies</h2><p className="mt-3 text-sm text-neutral-600">Recevez des demandes structurées pour mieux préparer les commandes.</p></Card></div>{isLoggedIn ? <ButtonLink href={getDashboardPathByRole(role)} className="mt-8">Accéder à mon tableau de bord</ButtonLink> : <ButtonLink href="/register?role=RESTAURANT" className="mt-8">Devenir restaurant partenaire</ButtonLink>}</div></main></>;
}
