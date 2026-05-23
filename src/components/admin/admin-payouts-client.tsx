"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/pricing/delivery";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface Payout {
  id: string;
  userId: string;
  amount: number;
  status: string;
  method: string | null;
  reference: string | null;
  requestedAt: string;
  paidAt: string | null;
  user: User;
}

export function AdminPayoutsClient() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/payouts")
      .then((res) => res.json())
      .then((json) => {
        setPayouts(json.payouts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function markPaid(id: string) {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/payouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (res.ok) {
        setPayouts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "PAID", paidAt: new Date().toISOString() } : p))
        );
      }
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>;

  const totalRequested = payouts.filter((p) => p.status === "REQUESTED").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Demandes de retrait</h1>

      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-500">Total en attente</div>
        <div className="text-2xl font-bold text-amber-600">{formatPrice(totalRequested)}</div>
      </div>

      {payouts.length === 0 ? (
        <p className="text-gray-500">Aucune demande.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Utilisateur</th>
                <th className="p-3 text-left font-medium">Rôle</th>
                <th className="p-3 text-right font-medium">Montant</th>
                <th className="p-3 text-left font-medium">Statut</th>
                <th className="p-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3 text-gray-600">{new Date(p.requestedAt).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">{p.user.name || p.user.email || "—"}</td>
                  <td className="p-3">{p.user.role}</td>
                  <td className="p-3 text-right font-medium">{formatPrice(p.amount)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                        p.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : p.status === "REQUESTED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {p.status === "REQUESTED" && (
                      <button
                        onClick={() => markPaid(p.id)}
                        disabled={processingId === p.id}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:bg-gray-300"
                      >
                        {processingId === p.id ? "..." : "Marquer payé"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
