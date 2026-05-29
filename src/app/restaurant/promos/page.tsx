"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";

interface Promo {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: string;
  discountValue?: number;
  usageCount: number;
  usageLimit?: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
}

export default function RestaurantPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState({ allowPromoCodes: false, maxActivePromoCodes: 0 });
  const [form, setForm] = useState({ code: "", title: "", description: "", discountType: "PERCENTAGE", discountValue: "", minOrderAmount: "", maxDiscountAmount: "", usageLimit: "", perCustomerLimit: "", startsAt: "", endsAt: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/restaurant/subscription").then((r) => r.json()).then((d) => setFeatures(d.features || { allowPromoCodes: false, maxActivePromoCodes: 0 }));
    fetch("/api/restaurant/promos").then((r) => r.json()).then((d) => { setPromos(d.promos || []); setLoading(false); });
  }, []);

  async function createPromo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const body = {
      code: form.code, title: form.title, description: form.description || undefined,
      discountType: form.discountType,
      discountValue: form.discountValue ? Number(form.discountValue) : undefined,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : undefined,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
    };
    const res = await fetch("/api/restaurant/promos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) { setPromos((prev) => [data.promo, ...prev]); setForm({ code: "", title: "", description: "", discountType: "PERCENTAGE", discountValue: "", minOrderAmount: "", maxDiscountAmount: "", usageLimit: "", perCustomerLimit: "", startsAt: "", endsAt: "" }); setMsg("Code promo créé."); }
    else { setMsg(data.message || "Erreur."); }
    setSaving(false);
  }

  async function togglePromo(id: string, active: boolean) {
    const res = await fetch(`/api/restaurant/promos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !active }) });
    if (res.ok) { setPromos((prev) => prev.map((p) => p.id === id ? { ...p, isActive: !active } : p)); }
  }

  if (loading) return <RestaurantShell title="Codes promos" sections={restaurantNavSections}><div className="p-6">Chargement…</div></RestaurantShell>;

  if (!features.allowPromoCodes) {
    return (
      <RestaurantShell title="Codes promos" sections={restaurantNavSections}>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-black">Codes promos verrouillés</h2>
          <p className="mt-3 text-neutral-600">Les codes promos sont disponibles à partir du plan Premium.</p>
          <Link href="/restaurant/subscription" className="mt-5 inline-block rounded-2xl bg-dalle-charcoal px-4 py-2 text-sm font-black text-white">Voir les plans</Link>
        </Card>
      </RestaurantShell>
    );
  }

  return (
    <RestaurantShell title="Codes promos" sections={restaurantNavSections}>
      <Card className="p-5 mb-5">
        <h2 className="text-xl font-black">Créer un code promo</h2>
        <form onSubmit={createPromo} className="mt-4 grid gap-3 md:grid-cols-2">
          <div><label className="text-sm font-bold">Code *</label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="KARL10" required /></div>
          <div><label className="text-sm font-bold">Titre *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Réduction bienvenue" required /></div>
          <div><label className="text-sm font-bold">Type</label>
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="PERCENTAGE">Pourcentage (%)</option>
              <option value="FIXED_AMOUNT">Montant fixe (FCFA)</option>
              <option value="FREE_DELIVERY">Livraison gratuite</option>
            </select>
          </div>
          <div><label className="text-sm font-bold">Valeur</label><Input type="number" min={0} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === "PERCENTAGE" ? "10" : "1000"} /></div>
          <div><label className="text-sm font-bold">Min. commande</label><Input type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="5000" /></div>
          <div><label className="text-sm font-bold">Max réduction</label><Input type="number" min={0} value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} placeholder="3000" /></div>
          <div><label className="text-sm font-bold">Limite utilisations</label><Input type="number" min={1} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="100" /></div>
          <div><label className="text-sm font-bold">Limite / client</label><Input type="number" min={1} value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} placeholder="1" /></div>
          <div><label className="text-sm font-bold">Début</label><Input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
          <div><label className="text-sm font-bold">Fin</label><Input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
          <div className="md:col-span-2"><Button type="submit" disabled={saving} className="w-full md:w-auto">{saving ? "Création…" : "Créer le code promo"}</Button></div>
        </form>
        {msg && <p className="mt-3 text-sm font-bold text-dalle-orange">{msg}</p>}
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Mes codes promo</h2>
        {promos.length === 0 ? <p className="mt-3 text-neutral-500">Aucun code promo créé.</p> : (
          <div className="mt-4 grid gap-3">
            {promos.map((p) => (
              <div key={p.id} className="flex flex-col justify-between gap-2 rounded-2xl bg-neutral-50 p-4 md:flex-row md:items-center">
                <div>
                  <p className="font-black">{p.code} — {p.title}</p>
                  <p className="text-sm text-neutral-500">{p.description || "—"} · {p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : p.discountType === "FIXED_AMOUNT" ? `${p.discountValue} FCFA` : "Livraison gratuite"}</p>
                  <p className="text-xs text-neutral-400">Utilisations : {p.usageCount}{p.usageLimit ? ` / ${p.usageLimit}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.isActive ? "lime" : "neutral"}>{p.isActive ? "Actif" : "Inactif"}</Badge>
                  <Button size="sm" variant="outline" onClick={() => togglePromo(p.id, p.isActive)}>{p.isActive ? "Désactiver" : "Activer"}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </RestaurantShell>
  );
}
