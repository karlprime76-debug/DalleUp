"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DriverAvailabilityToggle({ currentStatus }: { currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isAvailable = currentStatus === "AVAILABLE";
  const isOnDelivery = currentStatus === "ON_DELIVERY";

  async function toggle() {
    if (isOnDelivery) {
      setMessage("Vous ne pouvez pas modifier votre disponibilité pendant une livraison.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/driver/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isAvailable ? "OFFLINE" : "AVAILABLE" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? "Impossible de modifier le statut.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Service indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={isAvailable ? "outline" : "secondary"}
        disabled={loading || isOnDelivery}
        onClick={toggle}
        className="w-full"
      >
        {loading ? "Mise à jour..." : isAvailable ? "Passer hors ligne" : "Devenir disponible"}
      </Button>
      {message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}
    </div>
  );
}
