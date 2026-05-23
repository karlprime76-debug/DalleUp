import { redirect } from "next/navigation";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { RestaurantSettingsForm } from "@/components/restaurant/restaurant-settings-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { getRestaurantSettings } from "@/lib/data/restaurant-settings";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { formatPrice } from "@/lib/pricing/delivery";
import { prisma } from "@/lib/db/prisma";

export default async function RestaurantSettingsPage() {
  const session = await requireRole(["RESTAURANT"]);
  const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id } });
  if (!restaurant) redirect("/restaurant/onboarding");
  const settings = await getRestaurantSettings(session.user.id);
  return <RestaurantShell title="Paramètres" sections={restaurantNavSections}>{settings ? <div className="grid gap-5 xl:grid-cols-[1fr_340px]"><Card className="p-5"><h2 className="text-xl font-black">Profil restaurant</h2><p className="mb-5 mt-2 text-sm text-neutral-500">{settings.isMock ? "Fallback mock en lecture seule." : "Modifier les informations publiques de ton restaurant."}</p><RestaurantSettingsForm settings={settings} /></Card><Card className="h-fit p-5"><h2 className="text-xl font-black">Résumé</h2><div className="mt-4 grid gap-3 text-sm"><div className="flex justify-between"><span>Statut</span><Badge variant={settings.status === "APPROVED" ? "lime" : "neutral"}>{settings.status}</Badge></div><div className="flex justify-between"><span>Slug</span><b>{settings.slug}</b></div><div className="flex justify-between"><span>Livraison</span><b>{formatPrice(settings.deliveryFee)}</b></div><div className="flex justify-between"><span>Délai</span><b>{settings.minDelayMin}-{settings.maxDelayMin} min</b></div></div></Card></div> : <Card className="p-5"><h2 className="text-xl font-black">Restaurant introuvable</h2></Card>}</RestaurantShell>;
}

