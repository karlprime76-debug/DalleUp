"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const restaurantFlow = ["ACCEPTED", "PREPARING", "READY"];
const adminFlow = ["ACCEPTED", "PREPARING", "READY", "DRIVER_ASSIGNED", "ON_THE_WAY", "DELIVERED", "CANCELLED"];

export function OrderStatusActions({ orderId, role = "admin" }: { orderId?: string; role?: "admin" | "restaurant" }) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const statuses = role === "restaurant" ? restaurantFlow : adminFlow;

  async function updateStatus(status: string) {
    if (!orderId) {
      setMessage("Cette action n’est pas disponible pour le moment.");
      return;
    }
    setLoadingStatus(status);
    setMessage(null);
    try {
      const response = await fetch(`/api/ops/orders/${orderId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message ?? "Statut non modifié.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Base indisponible : impossible de modifier le statut.");
    } finally {
      setLoadingStatus(null);
    }
  }

  return <div className="grid gap-2"><div className="flex flex-wrap gap-2">{statuses.map((status) => <Button key={status} type="button" size="sm" variant={status === "CANCELLED" ? "outline" : "dark"} disabled={loadingStatus !== null} onClick={() => updateStatus(status)}>{loadingStatus === status ? "..." : status}</Button>)}</div>{message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}</div>;
}
