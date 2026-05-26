import Link from "next/link";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRestaurant } from "@/lib/auth/guards";
import { getRestaurantMenuForOwner } from "@/lib/data/restaurant-menu";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function RestaurantMenuPage() {
  const { session, restaurant: userRestaurant } = await requireRestaurant();
  const { restaurant, items } = await getRestaurantMenuForOwner(session.user.id);
  const categories = Array.from(new Set(items.map((item) => item.category)));
  return <RestaurantShell title="Mon menu" sections={restaurantNavSections}>{userRestaurant.status === "PENDING" ? <div className="mb-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">Votre restaurant est en attente de validation. Vous pouvez préparer votre menu en avance.</div> : null}<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h2 className="text-2xl font-black">{restaurant?.name ?? "Produits du restaurant"}</h2><p className="text-neutral-500">{`${items.length} produit(s), ${items.filter((item) => item.isActive).length} disponible(s) à la vente.`}</p></div><ButtonLink href="/restaurant/menu/new">Nouveau produit</ButtonLink></div>{items.length ? <div className="mt-6 grid gap-6">{categories.map((category) => <section key={category}><div className="mb-3 flex items-center justify-between"><h3 className="text-xl font-black text-dalle-charcoal">{category}</h3><Badge variant="neutral">{items.filter((item) => item.category === category).length} produit(s)</Badge></div><div className="grid gap-4">{items.filter((item) => item.category === category).map((item) => <Card key={item.id} className="grid gap-4 p-4 md:grid-cols-[96px_1fr_120px_120px_120px] md:items-center"><div className="h-24 rounded-2xl bg-neutral-100 bg-cover bg-center" style={{ backgroundImage: `url(${item.image || "/placeholder.svg"})` }} /><div><p className="font-black">{item.name}</p><p className="text-sm text-neutral-500">{item.description}</p><p className="mt-1 text-xs font-bold text-neutral-400">{item.category}{item.category === "Alcool" ? " · Produit soumis à restriction. Vérification d’âge requise." : ""}</p></div><span className="font-black text-dalle-orange">{formatPrice(item.price)}</span><Badge variant={item.isActive ? "lime" : "neutral"}>{item.isActive ? "Disponible" : "Indisponible"}</Badge><Link className="rounded-2xl bg-dalle-charcoal px-4 py-2 text-center text-sm font-black text-white" href={`/restaurant/menu/${item.id}/edit`}>Éditer</Link></Card>)}</div></section>)}</div> : <div className="mt-8"><EmptyState title="Menu vide" description="Ajoutez vos premiers produits pour préparer la mise en ligne du restaurant." actionHref="/restaurant/menu/new" actionLabel="Ajouter un produit" /></div>}</RestaurantShell>;
}

