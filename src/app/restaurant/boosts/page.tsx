"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";

interface Placement {
  id: string;
  type: string;
  startsAt: string;
  endsAt?: string;
  isActive: boolean;
}

export default function RestaurantBoostsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [features, setFeatures] = useState({ allowSponsoredPlacement: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/restaurant/subscription").then((r) => r.json()).then((d) => setFeatures(d.features || { allowSponsoredPlacement: false }));
    fetch("/api/restaurant/boosts").then((r) => r.json()).then((d) => { setPlacements(d.placements || []); setLoading(false); });
  }, []);

  async function createBoost(type: string) {
    const res = await fetch("/api/restaurant/boosts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
    const data = await res.json();
    if (res.ok && data.placement) setPlacements((prev) => [data.placement, ...prev]);
  }

  if (loading) return <RestaurantShell title="Mises en avant" sections={restaurantNavSections}><div className="p-6">Chargement…</div></RestaurantShell>;

  if (!features.allowSponsoredPlacement) {
    return (
      <RestaurantShell title="Mises en avant" sections={restaurantNavSections}>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-black">Mises en avant verrouillées</h2>
          <p className="mt-3 text-neutral-600">Les mises en avant sont disponibles à partir du plan Sponsorisé.</p>
          <Link href="/restaurant/subscription" className="mt-5 inline-block rounded-2xl bg-dalle-charcoal px-4 py-2 text-sm font-black text-white">Voir les plans</Link>
        </Card>
      </RestaurantShell>
    );
  }

  return (
    <RestaurantShell title="Mises en avant" sections={restaurantNavSections}>
      <div className="grid gap-4 md:grid-cols-3 mb-5">
        {["SPONSORED_LISTING", "HOME_FEATURED", "SEARCH_PRIORITY"].map((type) => (
          <Card key={type} className="p-5">
            <h3 className="font-black">{type === "SPONSORED_LISTING" ? "Sponsorisé" : type === "HOME_FEATURED" ? "Accueil" : "Recherche prioritaire"}</h3>
            <p className="mt-2 text-sm text-neutral-500">{type === "SPONSORED_LISTING" ? "Apparaissez dans la section sponsorisée." : type === "HOME_FEATURED" ? "Mis en avant sur la page d'accueil." : "Remontez dans les résultats de recherche."}</p>
            <Button size="sm" className="mt-3 w-full" onClick={() => createBoost(type)}>Activer</Button>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="text-xl font-black">Placements actifs</h2>
        {placements.length === 0 ? <p className="mt-3 text-neutral-500">Aucune mise en avant active.</p> : (
          <div className="mt-4 grid gap-3">
            {placements.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
                <div>
                  <p className="font-black">{p.type}</p>
                  <p className="text-sm text-neutral-500">{p.startsAt ? new Date(p.startsAt).toLocaleDateString("fr-FR") : ""} → {p.endsAt ? new Date(p.endsAt).toLocaleDateString("fr-FR") : ""}</p>
                </div>
                <Badge variant={p.isActive ? "lime" : "neutral"}>{p.isActive ? "Actif" : "Inactif"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </RestaurantShell>
  );
}
