"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => { setSubscriptions(d.subscriptions ?? []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Chargement…</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Abonnements restaurants</h1>
      <table className="w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2">Restaurant</th>
            <th className="py-2">Plan</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Début</th>
            <th className="py-2">Fin</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((s: unknown) => {
            const sub = s as { id: string; status: string; startsAt?: string; endsAt?: string; restaurant?: { name: string }; plan?: { name: string } };
            return (
              <tr key={sub.id} className="border-b">
                <td className="py-2">{sub.restaurant?.name}</td>
                <td className="py-2">{sub.plan?.name}</td>
                <td className="py-2"><Badge>{sub.status}</Badge></td>
                <td className="py-2">{sub.startsAt ? new Date(sub.startsAt).toLocaleDateString("fr-FR") : "—"}</td>
                <td className="py-2">{sub.endsAt ? new Date(sub.endsAt).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
