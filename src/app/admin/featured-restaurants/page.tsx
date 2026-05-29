"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function AdminFeaturedRestaurantsPage() {
  const [placements, setPlacements] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/featured-restaurants")
      .then((r) => r.json())
      .then((d) => { setPlacements(d.placements ?? []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Chargement…</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Mises en avant</h1>
      <table className="w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2">Restaurant</th>
            <th className="py-2">Type</th>
            <th className="py-2">Actif</th>
            <th className="py-2">Début</th>
            <th className="py-2">Fin</th>
          </tr>
        </thead>
        <tbody>
          {placements.map((p: unknown) => {
            const pl = p as { id: string; type: string; isActive: boolean; startsAt: string; endsAt?: string; restaurant?: { name: string } };
            return (
              <tr key={pl.id} className="border-b">
                <td className="py-2">{pl.restaurant?.name}</td>
                <td className="py-2">{pl.type}</td>
                <td className="py-2"><Badge>{pl.isActive ? "Oui" : "Non"}</Badge></td>
                <td className="py-2">{new Date(pl.startsAt).toLocaleDateString("fr-FR")}</td>
                <td className="py-2">{pl.endsAt ? new Date(pl.endsAt).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
