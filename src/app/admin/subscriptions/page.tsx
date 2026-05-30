"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => { setSubscriptions(d.subscriptions ?? []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Abonnements restaurants" sections={adminNavSections}>
      <Card className="p-5">
        <h2 className="text-xl font-black">Abonnements actifs</h2>
        <p className="mt-2 text-sm text-neutral-500">Liste des souscriptions restaurants et leurs plans.</p>
        {loading ? <div className="py-8 text-sm text-neutral-500">Chargement…</div> : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-2 pr-4">Restaurant</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Début</th>
                  <th className="py-2">Fin</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-sm text-neutral-500">Aucun abonnement trouvé.</td></tr>
                ) : subscriptions.map((s: unknown) => {
                  const sub = s as { id: string; status: string; startsAt?: string; endsAt?: string; restaurant?: { name: string }; plan?: { name: string } };
                  return (
                    <tr key={sub.id} className="border-b">
                      <td className="py-2 pr-4 font-bold">{sub.restaurant?.name ?? "—"}</td>
                      <td className="py-2 pr-4">{sub.plan?.name ?? "—"}</td>
                      <td className="py-2 pr-4"><Badge variant={sub.status === "ACTIVE" ? "lime" : sub.status === "CANCELLED" ? "orange" : "neutral"}>{sub.status}</Badge></td>
                      <td className="py-2 pr-4">{sub.startsAt ? new Date(sub.startsAt).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="py-2">{sub.endsAt ? new Date(sub.endsAt).toLocaleDateString("fr-FR") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
