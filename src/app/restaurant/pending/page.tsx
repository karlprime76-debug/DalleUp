import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, XCircle } from "lucide-react";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { Card } from "@/components/ui/card";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { requireRestaurant } from "@/lib/auth/guards";

export default async function RestaurantPendingPage() {
  const { restaurant } = await requireRestaurant();

  if (restaurant.status === "APPROVED") {
    redirect("/restaurant/dashboard");
  }

  const isSuspended = restaurant.status === "SUSPENDED";

  return (
    <RestaurantShell title={isSuspended ? "Restaurant suspendu" : "En attente de validation"} sections={restaurantNavSections}>
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-3xl ${isSuspended ? "bg-red-50 text-red-500" : "bg-orange-50 text-dalle-orange"}`}>
          {isSuspended ? <XCircle size={28} /> : <AlertTriangle size={28} />}
        </div>
        <h1 className="mt-5 text-2xl font-black text-dalle-charcoal">
          {isSuspended
            ? "Votre restaurant est suspendu."
            : "Votre restaurant est en attente de validation."}
        </h1>
        <p className="mt-3 text-neutral-500">
          {isSuspended
            ? "Votre restaurant a été suspendu. Contactez le support pour plus d'informations."
            : "Votre demande est en cours de vérification. Vous recevrez une notification après validation."}
        </p>
        {!isSuspended && (
          <p className="mt-2 text-sm text-neutral-400">Cela peut prendre jusqu&apos;à 24 heures ouvrées.</p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/restaurant/dashboard" className="rounded-2xl bg-dalle-charcoal px-4 py-3 text-center text-sm font-black text-white transition hover:bg-black">Retour au tableau de bord</Link>
          <Link href="/restaurant/onboarding" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-neutral-700 ring-1 ring-black/10 transition hover:bg-neutral-50">Modifier mon profil</Link>
        </div>
        <p className="mt-3 text-xs text-neutral-400">Restaurant : {restaurant.name} — Statut : {restaurant.status}</p>
      </Card>
    </RestaurantShell>
  );
}
