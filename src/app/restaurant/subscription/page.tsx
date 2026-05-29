"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RestaurantSubscriptionPage() {
  const [plans, setPlans] = useState<unknown[]>([]);
  const [current, setCurrent] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch("/api/restaurant/plans")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans ?? []);
        setCurrent(d.currentSubscription ?? null);
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

  if (loading) return <div className="p-8">Chargement…</div>;

  const currentSub = current as { status?: string; plan?: { name?: string }; startsAt?: string; endsAt?: string } | null;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Mon abonnement</h1>
      {currentSub && (
        <Card className="mb-6 p-6">
          <h2 className="mb-2 text-lg font-semibold">Abonnement actuel</h2>
          <div className="space-y-2">
            <p><strong>Plan :</strong> {currentSub.plan?.name || "—"}</p>
            <p><strong>Statut :</strong> <Badge>{currentSub.status}</Badge></p>
            <p><strong>Début :</strong> {currentSub.startsAt ? new Date(currentSub.startsAt).toLocaleDateString("fr-FR") : "—"}</p>
            <p><strong>Fin :</strong> {currentSub.endsAt ? new Date(currentSub.endsAt).toLocaleDateString("fr-FR") : "—"}</p>
          </div>
        </Card>
      )}
      <h2 className="mb-4 text-xl font-semibold">Plans disponibles</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((p: unknown) => {
          const plan = p as { id: string; name: string; code: string; description?: string; price: number; durationDays: number; features?: Record<string, unknown> };
          return (
            <Card key={plan.id} className="p-6">
              <h3 className="mb-2 text-lg font-semibold">{plan.name}</h3>
              <div className="space-y-2">
                <p className="text-muted-foreground">{plan.description}</p>
                <p className="text-lg font-bold">{plan.price.toLocaleString("fr-FR")} FCFA / {plan.durationDays} jours</p>
                <Button onClick={() => subscribe(plan.code)} disabled={paying} className="w-full">{paying ? "Redirection…" : "Souscrire"}</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
