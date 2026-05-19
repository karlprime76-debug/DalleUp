"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const statuses = ["PICKED_UP", "ON_THE_WAY", "DELIVERED"];

export function DeliveryStatusActions({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(status: string) {
    if (!orderId) {
      setMessage("Action disponible avec une livraison Prisma assignée.");
      return;
    }
    setLoadingStatus(status);
    setMessage(null);
    try {
      const response = await fetch(`/api/ops/deliveries/${orderId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message ?? "Livraison non modifiée.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Base indisponible : livraison non modifiée.");
    } finally {
      setLoadingStatus(null);
    }
  }

  return <div className="grid gap-2"><div className="flex flex-wrap gap-2">{statuses.map((status) => <Button key={status} type="button" size="sm" variant="dark" disabled={loadingStatus !== null} onClick={() => updateStatus(status)}>{loadingStatus === status ? "..." : status}</Button>)}</div>{message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}</div>;
}
