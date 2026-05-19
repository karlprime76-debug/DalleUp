"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing/delivery";
import type { RestaurantBillingPlan } from "@/lib/data/restaurant-billing";

export function RestaurantPlanActions({ plans, currentPlanId, disabled }: { plans: RestaurantBillingPlan[]; currentPlanId?: string; disabled?: boolean }) {
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(disabled ? "Fallback mock en lecture seule." : null);

  async function changePlan(planId: string) {
    if (disabled) {
      setMessage("Changement de plan disponible avec une DB migrée.");
      return;
    }
    setLoadingPlanId(planId);
    setMessage(null);
    try {
      const response = await fetch("/api/restaurant/billing/subscription", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message ?? "Plan non modifié.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Base indisponible : changement de plan impossible.");
    } finally {
      setLoadingPlanId(null);
    }
  }

  return <div className="grid gap-3">{plans.map((plan) => <div key={plan.id} className="rounded-2xl bg-neutral-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{plan.name}</p><p className="text-sm text-neutral-500">{plan.description || `${plan.commissionRate}% commission`}</p><p className="text-xs font-bold text-neutral-400">{formatPrice(plan.monthlyFee)} · {plan.interval}</p></div><Button type="button" size="sm" variant={plan.id === currentPlanId ? "outline" : "secondary"} disabled={loadingPlanId !== null || plan.id === currentPlanId} onClick={() => changePlan(plan.id)}>{loadingPlanId === plan.id ? "..." : plan.id === currentPlanId ? "Actuel" : "Choisir"}</Button></div></div>)}{message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}</div>;
}
