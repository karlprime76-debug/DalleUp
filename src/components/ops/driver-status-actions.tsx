"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const statuses = ["PENDING", "AVAILABLE", "OFFLINE", "ON_DELIVERY", "SUSPENDED"];

export function DriverStatusActions({ driverId }: { driverId?: string }) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(status: string) {
    if (!driverId) {
      setMessage("Action disponible avec un livreur Prisma.");
      return;
    }
    setLoadingStatus(status);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
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

  return <div className="grid gap-2"><div className="flex flex-wrap gap-2">{statuses.map((status) => <Button key={status} type="button" size="sm" variant={status === "AVAILABLE" ? "secondary" : status === "SUSPENDED" ? "outline" : "dark"} disabled={loadingStatus !== null} onClick={() => updateStatus(status)}>{loadingStatus === status ? "..." : status}</Button>)}</div>{message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}</div>;
}
