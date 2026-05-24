"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeliveryActions({ deliveryId, status }: { deliveryId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function acceptDelivery() {
    setLoading("ACCEPT");
    setMessage(null);
    try {
      const res = await fetch(`/api/driver/deliveries/${deliveryId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? "Erreur lors de l'acceptation.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Service indisponible.");
    } finally {
      setLoading(null);
    }
  }

  async function updateStatus(newStatus: string) {
    setLoading(newStatus);
    setMessage(null);
    try {
      const res = await fetch(`/api/driver/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? "Erreur lors du changement de statut.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Service indisponible.");
    } finally {
      setLoading(null);
    }
  }

  if (status === "PENDING") {
    return (
      <div className="grid gap-2">
        <Button onClick={acceptDelivery} disabled={loading !== null}>{loading === "ACCEPT" ? "..." : "Accepter la livraison"}</Button>
        {message ? <p className="mt-2 text-xs font-bold text-dalle-orange">{message}</p> : null}
      </div>
    );
  }

  if (status === "ASSIGNED") {
    return (
      <div className="grid gap-2">
        <Button onClick={() => updateStatus("PICKED_UP")} disabled={loading !== null}>{loading === "PICKED_UP" ? "..." : "J'ai récupéré la commande"}</Button>
        {message ? <p className="mt-2 text-xs font-bold text-dalle-orange">{message}</p> : null}
      </div>
    );
  }

  if (status === "PICKED_UP") {
    return (
      <div className="grid gap-2">
        <Button onClick={() => updateStatus("ON_THE_WAY")} disabled={loading !== null}>{loading === "ON_THE_WAY" ? "..." : "Je suis en route"}</Button>
        {message ? <p className="mt-2 text-xs font-bold text-dalle-orange">{message}</p> : null}
      </div>
    );
  }

  if (status === "ON_THE_WAY") {
    return (
      <div className="grid gap-2">
        <Button onClick={() => updateStatus("DELIVERED")} disabled={loading !== null}>{loading === "DELIVERED" ? "..." : "Marquer comme livrée"}</Button>
        {message ? <p className="mt-2 text-xs font-bold text-dalle-orange">{message}</p> : null}
      </div>
    );
  }

  if (status === "DELIVERED") {
    return <p className="text-sm font-bold text-dalle-lime">Livraison terminée</p>;
  }

  if (status === "FAILED") {
    return <p className="text-sm font-bold text-neutral-500">Livraison annulée</p>;
  }

  return null;
}
