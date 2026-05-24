"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminDeliveryActions({ orderId, currentDriverId }: { orderId?: string; currentDriverId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function releaseDelivery() {
    if (!orderId) return;
    setLoading("release");
    setMessage(null);
    try {
      const res = await fetch(`/api/ops/orders/${orderId}/assign-driver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? "Échec de la libération.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Service indisponible.");
    } finally {
      setLoading(null);
    }
  }

  async function cancelDelivery() {
    if (!orderId) return;
    setLoading("cancel");
    setMessage(null);
    try {
      const res = await fetch(`/api/ops/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? "Échec de l'annulation.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Service indisponible.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {currentDriverId ? (
          <Button type="button" size="sm" variant="outline" disabled={loading !== null} onClick={releaseDelivery}>
            {loading === "release" ? "..." : "Libérer livraison"}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="outline" disabled={loading !== null} onClick={cancelDelivery}>
          {loading === "cancel" ? "..." : "Annuler commande"}
        </Button>
      </div>
      {message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}
    </div>
  );
}
