"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OpsDriver } from "@/lib/data/ops";

export function AssignDriverActions({ orderId, drivers, currentDriverId }: { orderId?: string; drivers: OpsDriver[]; currentDriverId?: string }) {
  const router = useRouter();
  const assignable = drivers.filter((d) => d.status === "AVAILABLE" || d.status === "OFFLINE");
  const [driverId, setDriverId] = useState(currentDriverId ?? assignable[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function assignDriver() {
    if (!orderId) {
      setMessage("Assignation indisponible pour le moment.");
      return;
    }
    if (!driverId) {
      setMessage("Sélectionnez un livreur.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/ops/orders/${orderId}/assign-driver`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ driverId }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message ?? "Assignation non effectuée.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Base indisponible : assignation impossible.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="grid gap-2"><div className="flex flex-wrap gap-2"><select className="rounded-xl bg-white px-3 py-2 text-xs font-bold ring-1 ring-black/10" value={driverId} onChange={(event) => setDriverId(event.target.value)}>{assignable.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} · {driver.status}</option>)}</select><Button type="button" size="sm" variant="secondary" disabled={loading || assignable.length === 0} onClick={assignDriver}>{loading ? "..." : "Assigner"}</Button></div>{message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}</div>;
}
