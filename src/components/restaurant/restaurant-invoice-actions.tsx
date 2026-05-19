"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RestaurantInvoice } from "@/lib/data/restaurant-billing";

export function RestaurantInvoiceActions({ invoices, disabled }: { invoices: RestaurantInvoice[]; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(disabled ? "Fallback mock en lecture seule." : null);

  async function requestAction(key: string, url: string, method: "PATCH" | "POST") {
    if (disabled) {
      setMessage("Action disponible avec une DB migrée.");
      return;
    }
    setLoading(key);
    setMessage(null);
    try {
      const response = await fetch(url, { method });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message ?? "Action non effectuée.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Base indisponible : action impossible.");
    } finally {
      setLoading(null);
    }
  }

  return <div className="grid gap-3"><Button type="button" size="sm" variant="secondary" disabled={loading !== null} onClick={() => requestAction("generate", "/api/restaurant/billing/invoices/generate", "POST")}>{loading === "generate" ? "..." : "Générer facture mensuelle"}</Button><div className="grid gap-2">{invoices.map((invoice) => <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 p-3"><span className="text-xs font-black">{invoice.number}</span><Button type="button" size="sm" variant="outline" disabled={loading !== null || invoice.status === "PAID"} onClick={() => requestAction(invoice.id, `/api/restaurant/billing/invoices/${invoice.id}/pay`, "PATCH")}>{loading === invoice.id ? "..." : invoice.status === "PAID" ? "Payée" : "Payer"}</Button></div>)}</div>{message ? <p className="text-xs font-bold text-dalle-orange">{message}</p> : null}</div>;
}
