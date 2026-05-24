import Link from "next/link";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { Card } from "@/components/ui/card";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { requireRestaurant } from "@/lib/auth/guards";

export default async function RestaurantPendingPage() {
  const { restaurant } = await requireRestaurant();
  return (
    <RestaurantShell title="En attente de validation" sections={restaurantNavSections}>
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-orange-50 text-dalle-orange">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h1 className="mt-5 text-2xl font-black text-dalle-charcoal">Votre restaurant est en attente de validation.</h1>
        <p className="mt-3 text-neutral-500">Votre demande est en cours de vérification. Vous recevrez une notification après validation.</p>
        <p className="mt-2 text-sm text-neutral-400">Cela peut prendre jusqu&apos;à 24 heures ouvrées.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/restaurant/dashboard" className="rounded-2xl bg-dalle-charcoal px-4 py-3 text-center text-sm font-black text-white transition hover:bg-black">Retour au tableau de bord</Link>
          <Link href="/restaurant/onboarding" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-neutral-700 ring-1 ring-black/10 transition hover:bg-neutral-50">Modifier mon profil</Link>
        </div>
        <p className="mt-3 text-xs text-neutral-400">Restaurant : {restaurant.name}</p>
      </Card>
    </RestaurantShell>
  );
}
