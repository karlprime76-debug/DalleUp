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

export default function DriverWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

  useEffect(() => {
    fetch("/api/driver/wallet")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!data) return <div className="p-6">Erreur de chargement.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mon solde livreur</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-500">Solde disponible</div>
          <div className="text-2xl font-bold text-green-700">{formatPrice(data.balance)}</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-500">En attente</div>
          <div className="text-2xl font-bold text-amber-600">{formatPrice(data.pendingBalance)}</div>
        </div>
      </div>

      <button
        onClick={requestPayout}
        disabled={payoutLoading || data.balance <= 0}
        className="mb-8 w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition"
      >
        {payoutLoading ? "Traitement..." : `Demander un retrait de ${formatPrice(data.balance)}`}
      </button>
      {payoutMsg && <p className="mb-4 text-sm text-center text-gray-700">{payoutMsg}</p>}

      <h2 className="text-lg font-semibold mb-4">Historique des transactions</h2>
      {data.entries.length === 0 ? (
        <p className="text-gray-500">Aucune transaction.</p>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-right p-3 font-medium">Montant</th>
                <th className="text-left p-3 font-medium">Statut</th>
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entry.status === "SETTLED" ? "bg-green-100 text-green-800" : entry.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
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
