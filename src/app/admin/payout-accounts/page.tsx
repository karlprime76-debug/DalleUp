"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPayoutAccountsPage() {
  const [accounts, setAccounts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/payout-accounts")
      .then((r) => r.json())
      .then((d) => { setAccounts(d.accounts ?? []); })
      .finally(() => setLoading(false));
  }, []);

  async function verify(id: string) {
    await fetch(`/api/admin/payout-accounts/${id}/verify`, { method: "POST" });
    window.location.reload();
  }

  async function reject(id: string) {
    const reason = prompt("Raison du rejet ?");
    await fetch(`/api/admin/payout-accounts/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    window.location.reload();
  }

  if (loading) return <div className="p-8">Chargement…</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Comptes de paiement</h1>
      <table className="w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2">Type</th>
            <th className="py-2">Méthode</th>
            <th className="py-2">Téléphone</th>
            <th className="py-2">Titulaire</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a: unknown) => {
            const acc = a as { id: string; ownerType: string; method: string; phone?: string; accountName?: string; isVerified: boolean; rejectedAt?: string };
            return (
              <tr key={acc.id} className="border-b">
                <td className="py-2">{acc.ownerType}</td>
                <td className="py-2">{acc.method}</td>
                <td className="py-2">{acc.phone}</td>
                <td className="py-2">{acc.accountName}</td>
                <td className="py-2">
                  {acc.rejectedAt ? <Badge variant="orange">Rejeté</Badge> : acc.isVerified ? <Badge variant="lime">Vérifié</Badge> : <Badge variant="neutral">En attente</Badge>}
                </td>
                <td className="py-2 space-x-2">
                  {!acc.isVerified && !acc.rejectedAt && <Button size="sm" onClick={() => verify(acc.id)}>Vérifier</Button>}
                  {!acc.rejectedAt && <Button size="sm" variant="outline" onClick={() => reject(acc.id)}>Rejeter</Button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
