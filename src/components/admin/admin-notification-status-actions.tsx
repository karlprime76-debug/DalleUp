"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const statuses = ["SENT", "FAILED", "PENDING"];

export function AdminNotificationStatusActions({ notificationId, currentStatus, disabled }: { notificationId?: string; currentStatus: string; disabled?: boolean }) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(disabled ? "Fallback mock en lecture seule." : null);

  async function updateStatus(status: string) {
    if (!notificationId || disabled) {
      setMessage("Action disponible avec une notification Prisma.");
      return;
    }
    setLoadingStatus(status);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message ?? "Statut non modifié.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Base indisponible : impossible de modifier la notification.");
    } finally {
      setLoadingStatus(null);
    }
  }

  return <div className="grid gap-2"><div className="flex flex-wrap gap-2">{statuses.map((status) => <Button key={status} type="button" size="sm" variant={status === "SENT" ? "secondary" : status === "FAILED" ? "outline" : "dark"} disabled={loadingStatus !== null || status === currentStatus} onClick={() => updateStatus(status)}>{loadingStatus === status ? "..." : status}</Button>)}</div>{message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}</div>;
}
