"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const statuses = ["PAID", "VOID", "UNCOLLECTIBLE", "OPEN"];

export function AdminInvoiceStatusActions({ invoiceId, currentStatus, disabled }: { invoiceId?: string; currentStatus: string; disabled?: boolean }) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(status: string) {
    if (!invoiceId || disabled) {
      setMessage("Cette action n’est pas disponible pour le moment.");
      return;
    }
    setLoadingStatus(status);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message ?? "Statut non modifié.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Base indisponible : impossible de modifier la facture.");
    } finally {
      setLoadingStatus(null);
    }
  }

  return <div className="grid gap-2"><div className="flex flex-wrap gap-2">{statuses.map((status) => <Button key={status} type="button" size="sm" variant={status === "PAID" ? "secondary" : status === "UNCOLLECTIBLE" ? "outline" : "dark"} disabled={loadingStatus !== null || status === currentStatus} onClick={() => updateStatus(status)}>{loadingStatus === status ? "..." : status}</Button>)}</div>{message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}</div>;
}
