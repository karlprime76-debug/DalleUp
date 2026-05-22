import Link from "next/link";
import { getServerSession } from "next-auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/config";
import { getRestaurantMenuForOwner } from "@/lib/data/restaurant-menu";
import { formatPrice } from "@/lib/pricing/delivery";

const nav = [{ href: "/restaurant/dashboard", label: "Accueil" }, { href: "/restaurant/orders", label: "Commandes" }, { href: "/restaurant/menu", label: "Menu" }, { href: "/restaurant/billing", label: "Facturation" }, { href: "/restaurant/settings", label: "Paramètres" }];

export default async function RestaurantMenuPage() {
  const session = await getServerSession(authOptions);
  const { restaurant, items } = await getRestaurantMenuForOwner(session?.user?.id);
  return <DashboardShell title="Catalogue restaurant" nav={nav}><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h2 className="text-2xl font-black">{restaurant?.name ?? "Produits du restaurant"}</h2><p className="text-neutral-500">{restaurant?.isMock ? "Fallback mock en lecture seule." : "Gérez plats, boissons, jus, desserts, extras et autres produits."}</p></div><ButtonLink href="/restaurant/menu/new">Nouveau produit</ButtonLink></div><div className="mt-6 grid gap-4">{items.map((item) => <Card key={item.id} className="grid gap-4 p-5 md:grid-cols-[1fr_120px_120px_120px]"><div><p className="font-black">{item.name}</p><p className="text-sm text-neutral-500">{item.description}</p><p className="mt-1 text-xs font-bold text-neutral-400">{item.category}{item.category === "Alcool" ? " · Produit soumis à restriction. Vérification d’âge requise." : ""}</p></div><span className="font-black text-dalle-orange">{formatPrice(item.price)}</span><Badge variant={item.isActive ? "lime" : "neutral"}>{item.isActive ? "Disponible" : "Indisponible"}</Badge><Link className="rounded-2xl bg-dalle-charcoal px-4 py-2 text-center text-sm font-black text-white" href={`/restaurant/menu/${item.id}/edit`}>Éditer</Link></Card>)}</div></DashboardShell>;
}

