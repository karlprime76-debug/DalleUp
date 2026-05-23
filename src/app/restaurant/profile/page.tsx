import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { RestaurantSettingsForm } from "@/components/restaurant/restaurant-settings-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireApprovedRestaurant } from "@/lib/auth/guards";
import { getRestaurantSettings } from "@/lib/data/restaurant-settings";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function RestaurantProfilePage() {
  const { session } = await requireApprovedRestaurant();
  const settings = await getRestaurantSettings(session.user.id);
  if (!settings) return <RestaurantShell title="Profil restaurant"><Card className="p-5"><h2 className="text-xl font-black">Restaurant introuvable</h2></Card></RestaurantShell>;

  return (
    <RestaurantShell title="Profil restaurant" sections={restaurantNavSections}>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <h2 className="text-xl font-black">Informations publiques</h2>
          <p className="mb-5 mt-2 text-sm text-neutral-500">{settings.isMock ? "Fallback mock en lecture seule." : "Modifier les informations affichées aux clients."}</p>
          <RestaurantSettingsForm settings={settings} />
        </Card>
        <div className="grid gap-5">
          <Card className="h-fit p-5">
            <h2 className="text-xl font-black">Résumé</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span>Statut</span><Badge variant={settings.status === "APPROVED" ? "lime" : "neutral"}>{settings.status}</Badge></div>
              <div className="flex justify-between"><span>Slug</span><b>{settings.slug}</b></div>
              <div className="flex justify-between"><span>Livraison</span><b>{formatPrice(settings.deliveryFee)}</b></div>
              <div className="flex justify-between"><span>Délai</span><b>{settings.minDelayMin}-{settings.maxDelayMin} min</b></div>
            </div>
          </Card>
          <Card className="h-fit p-5">
            <h2 className="text-xl font-black">Actions</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/restaurant/menu" className="flex items-center gap-2 font-bold text-dalle-orange hover:underline"><ArrowRight size={16} /> Gérer mon menu</Link>
              <Link href="/restaurant/orders" className="flex items-center gap-2 font-bold text-dalle-orange hover:underline"><ArrowRight size={16} /> Voir les commandes</Link>
              <Link href="/restaurant/dashboard" className="flex items-center gap-2 font-bold text-dalle-orange hover:underline"><ArrowRight size={16} /> Tableau de bord</Link>
            </div>
          </Card>
        </div>
      </div>
    </RestaurantShell>
  );
}
