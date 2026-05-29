"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";

interface PlanFeature {
  priorityScore: number;
  allowPromoCodes: boolean;
  maxActivePromoCodes: number;
  allowSponsoredPlacement: boolean;
  allowFeaturedDishes: boolean;
  allowAdvancedStats: boolean;
}

interface Plan {
  id: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  durationDays: number;
  commissionRate: number;
  features: PlanFeature;
  isCurrent: boolean;
}

interface Subscription {
  id: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  autoRenew: boolean;
  plan?: { code: string; name: string };
}

export default function RestaurantSubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<Subscription | null>(null);
  const [currentFeatures, setCurrentFeatures] = useState<PlanFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  useEffect(() => {
    fetch("/api/restaurant/plans")
      .then((r) => r.json())
      .then((d) => {
        setPlans((d.plans ?? []) as Plan[]);
        setCurrent(d.currentSubscription ?? null);
        setCurrentFeatures(d.currentFeatures ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function subscribe(planCode: string) {
    setPaying(true);
    const res = await fetch("/api/restaurant/subscriptions/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode }),
    });
    const data = await res.json();
    setPaying(false);
    if (res.ok && data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      alert(data.message || "Erreur lors de la création du paiement.");
    }
  }

  async function cancelRenewal() {
    const res = await fetch("/api/restaurant/subscription/cancel", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setCancelMsg(data.message);
      setCurrent((prev) => prev ? { ...prev, autoRenew: false } : prev);
    } else {
      setCancelMsg(data.message || "Erreur.");
    }
  }

  if (loading) return <RestaurantShell title="Mon abonnement" sections={restaurantNavSections}><div className="p-6">Chargement…</div></RestaurantShell>;

  const currentPlan = current?.plan?.name || "Gratuit";

  function featureList(features: PlanFeature) {
    return [
      { label: "Codes promo", ok: features.allowPromoCodes, detail: features.allowPromoCodes ? `max ${features.maxActivePromoCodes}` : null },
      { label: "Mises en avant", ok: features.allowSponsoredPlacement },
      { label: "Plats tendances", ok: features.allowFeaturedDishes },
      { label: "Statistiques avancées", ok: features.allowAdvancedStats },
      { label: "Priorité recherche", ok: features.priorityScore > 0, detail: `score ${features.priorityScore}` },
    ];
  }

  return (
    <RestaurantShell title="Mon abonnement" sections={restaurantNavSections}>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-dalle-orange">Plan actuel</p>
            <h2 className="text-2xl font-black">{currentPlan}</h2>
            {current && (
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-neutral-500">
                <Badge variant={current.status === "ACTIVE" ? "lime" : "neutral"}>{current.status}</Badge>
                {current.endsAt && <span>Expire le {new Date(current.endsAt).toLocaleDateString("fr-FR")}</span>}
                {current.autoRenew && <span>Renouvellement auto</span>}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {current?.status === "ACTIVE" && current.autoRenew && (
              <Button variant="outline" size="sm" onClick={cancelRenewal}>Désactiver le renouvellement</Button>
            )}
            <Link href="/restaurant/promos" className="rounded-2xl bg-dalle-charcoal px-4 py-2 text-sm font-black text-white">Codes promo</Link>
            <Link href="/restaurant/boosts" className="rounded-2xl bg-dalle-charcoal px-4 py-2 text-sm font-black text-white">Mises en avant</Link>
          </div>
        </div>
        {cancelMsg && <p className="mt-3 text-sm font-bold text-dalle-orange">{cancelMsg}</p>}
        {currentFeatures && (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {featureList(currentFeatures).map((f) => (
              <div key={f.label} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                <span>{f.label}</span>
                <span className={f.ok ? "text-dalle-lime font-bold" : "text-neutral-400"}>{f.ok ? (f.detail ? `✓ ${f.detail}` : "✓") : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <h2 className="mb-4 text-xl font-black">Plans disponibles</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className={`p-5 ${plan.isCurrent ? "ring-2 ring-dalle-lime" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black">{plan.name}</h3>
                <p className="text-sm text-neutral-500">{plan.description}</p>
              </div>
              {plan.isCurrent && <Badge variant="lime">Actuel</Badge>}
            </div>
            <p className="mt-2 text-lg font-bold text-dalle-orange">{plan.price.toLocaleString("fr-FR")} FCFA <span className="text-sm font-normal text-neutral-500">/ {plan.durationDays} jours</span></p>
            <p className="text-xs text-neutral-400">Commission : {plan.commissionRate}%</p>
            <div className="mt-3 grid gap-1 text-sm">
              {featureList(plan.features).map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className={f.ok ? "text-dalle-lime" : "text-neutral-300"}>{f.ok ? "✓" : "○"}</span>
                  <span className={f.ok ? "text-neutral-700" : "text-neutral-400"}>{f.label} {f.detail ? `(${f.detail})` : ""}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => subscribe(plan.code)} disabled={paying || plan.isCurrent} className="mt-4 w-full">
              {plan.isCurrent ? "Plan actuel" : paying ? "Redirection…" : "Souscrire"}
            </Button>
          </Card>
        ))}
      </div>
    </RestaurantShell>
  );
}

