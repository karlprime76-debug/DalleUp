"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function SponsorshipToggle({ restaurantId, initialValue, restaurantName }: { restaurantId: string; initialValue: boolean; restaurantName: string }) {
  const [isPopular, setIsPopular] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/sponsorships", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, isPopular: !isPopular })
      });
      if (response.ok) {
        setIsPopular(!isPopular);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
        isPopular
          ? "bg-dalle-orange text-white hover:bg-orange-600"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      } disabled:opacity-50`}
      aria-label={`${isPopular ? "Retirer" : "Ajouter"} ${restaurantName} des restaurants sponsorisés`}
    >
      <Badge variant={isPopular ? "lime" : "neutral"} className="pointer-events-none">
        {isPopular ? "Sponsorisé" : "Standard"}
      </Badge>
      <span className="ml-1">{loading ? "..." : isPopular ? "Retirer" : "Mettre en avant"}</span>
    </button>
  );
}
