"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/pricing/delivery";

interface LedgerEntry {
  id: string;
  orderId: string | null;
  type: string;
  amount: number;
  direction: string;
  status: string;
  description: string | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
  pendingBalance: number;
  currency: string;
  entries: LedgerEntry[];
}

export function DriverWalletClient() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

  async function requestPayout() {
    if (!data || data.balance <= 0) return;
    setPayoutLoading(true);
    setPayoutMsg("");
    try {
      const res = await fetch("/api/driver/payout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: data.balance }) });
      const json = await res.json();
      if (res.ok) {
        setPayoutMsg("Demande de retrait envoyée.");
        setData((prev) => prev ? { ...prev, balance: 0, pendingBalance: prev.pendingBalance + data.balance } : null);
      } else {
        setPayoutMsg(json.message || "Erreur.");
      }
    } catch {
      setPayoutMsg("Erreur réseau.");
    } finally {
      setPayoutLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/driver/wallet")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!data) return <div className="p-6">Erreur de chargement.</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Mon solde livreur</h1>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Solde disponible</div>
          <div className="text-2xl font-bold text-green-700">{formatPrice(data.balance)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">En attente</div>
          <div className="text-2xl font-bold text-amber-600">{formatPrice(data.pendingBalance)}</div>
        </div>
      </div>

      <button
        onClick={requestPayout}
        disabled={payoutLoading || data.balance <= 0}
        className="mb-8 w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {payoutLoading ? "Traitement..." : `Demander un retrait de ${formatPrice(data.balance)}`}
      </button>
      {payoutMsg && <p className="mb-4 text-center text-sm text-gray-700">{payoutMsg}</p>}

      <h2 className="mb-4 text-lg font-semibold">Historique des transactions</h2>
      {data.entries.length === 0 ? (
        <p className="text-gray-500">Aucune transaction.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-right font-medium">Montant</th>
                <th className="p-3 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="p-3 text-gray-600">{new Date(entry.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">{entry.type === "DRIVER_PAYOUT" ? "Commission livraison" : entry.type}</td>
                  <td className={`p-3 text-right font-medium ${entry.direction === "CREDIT" ? "text-green-700" : "text-red-600"}`}>
                    {entry.direction === "CREDIT" ? "+" : "-"}{formatPrice(entry.amount)}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${entry.status === "SETTLED" ? "bg-green-100 text-green-800" : entry.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                      {entry.status}
                    </span>
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
