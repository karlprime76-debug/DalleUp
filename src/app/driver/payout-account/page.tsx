"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DriverPayoutAccountPage() {
  const [accounts, setAccounts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [method, setMethod] = useState("MTN_MONEY");
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    fetch("/api/driver/payout-account")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts ?? []);
        if (d.accounts?.[0]) {
          const a = d.accounts[0];
          setMethod(a.method ?? "MTN_MONEY");
          setPhone(a.phone ?? "");
          setAccountName(a.accountName ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/driver/payout-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, phone, accountName }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMessage("Informations enregistrées. En attente de vérification admin.");
      setAccounts([data.account]);
    } else {
      setMessage(data.message || "Erreur.");
    }
  }

  if (loading) return <div className="p-8">Chargement…</div>;

  const account = accounts[0] as { isVerified?: boolean; rejectedAt?: string; rejectionReason?: string } | undefined;

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Mes informations de paiement</h1>
      {account?.isVerified && <div className="mb-4 rounded-md border bg-green-50 px-4 py-3 text-sm text-green-800">Compte vérifié.</div>}
      {account?.rejectedAt && <div className="mb-4 rounded-md border bg-red-50 px-4 py-3 text-sm text-red-800">Rejeté : {account.rejectionReason || "Aucune raison"}</div>}
      {!account?.isVerified && !account?.rejectedAt && account && <div className="mb-4 rounded-md border bg-yellow-50 px-4 py-3 text-sm text-yellow-800">En attente de vérification admin.</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Méthode</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-md border px-3 py-2">
            <option value="MTN_MONEY">MTN Mobile Money</option>
            <option value="MOOV_MONEY">Moov Money</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Numéro de téléphone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+229 01 50 25 59 93" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Nom du titulaire</label>
          <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Nom complet" required />
        </div>
        <Button type="submit" disabled={saving} className="w-full">{saving ? "Enregistrement…" : "Enregistrer"}</Button>
      </form>
      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
