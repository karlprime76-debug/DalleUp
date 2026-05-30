"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SavedAddressItem = {
  id: string;
  label: string;
  addressText: string;
  commune?: string;
  neighborhood?: string;
  landmarkText?: string;
  instructions?: string;
  phone?: string;
  isDefault: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [addressText, setAddressText] = useState("");
  const [commune, setCommune] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [landmarkText, setLandmarkText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/saved-addresses");
      const data = await res.json().catch(() => ({ addresses: [] }));
      setAddresses(data.addresses ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!addressText.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/user/saved-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || "Adresse",
          addressText: addressText.trim(),
          commune: commune.trim() || null,
          neighborhood: neighborhood.trim() || null,
          landmarkText: landmarkText.trim() || null,
          instructions: instructions.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      setFormOpen(false);
      resetForm();
      fetchAddresses();
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id: string) {
    if (!confirm("Supprimer cette adresse ?")) return;
    await fetch(`/api/user/saved-addresses/${id}`, { method: "DELETE" });
    fetchAddresses();
  }

  function resetForm() {
    setLabel("");
    setAddressText("");
    setCommune("");
    setNeighborhood("");
    setLandmarkText("");
    setInstructions("");
    setPhone("");
  }

  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-dalle-charcoal">Mes adresses</h1>
          <Button size="sm" onClick={() => setFormOpen((v) => !v)}>
            <Plus size={16} className="mr-1" />
            {formOpen ? "Annuler" : "Ajouter"}
          </Button>
        </div>

        {formOpen ? (
          <Card className="mt-5 p-5">
            <form onSubmit={addAddress} className="grid gap-3">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé : Maison, Bureau…" />
              <Input value={addressText} onChange={(e) => setAddressText(e.target.value)} placeholder="Adresse complète *" required />
              <div className="grid grid-cols-2 gap-3">
                <Input value={commune} onChange={(e) => setCommune(e.target.value)} placeholder="Commune" />
                <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Quartier" />
              </div>
              <Input value={landmarkText} onChange={(e) => setLandmarkText(e.target.value)} placeholder="Repère proche : pharmacie, carrefour…" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" type="tel" />
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-20 w-full rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-semibold outline-none shadow-sm placeholder:text-neutral-400 focus:border-dalle-orange focus:ring-4 focus:ring-dalle-orange/10"
                placeholder="Instructions au livreur : étage, portail, couleur de maison…"
              />
              <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
            </form>
          </Card>
        ) : null}

        {loading ? (
          <div className="mt-6 text-sm text-neutral-500">Chargement…</div>
        ) : addresses.length === 0 ? (
          <div className="mt-6 text-sm text-neutral-500">Aucune adresse enregistrée.</div>
        ) : (
          <div className="mt-6 grid gap-3">
            {addresses.map((addr) => (
              <Card key={addr.id} className="flex items-start justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-dalle-orange" />
                    <span className="font-black">{addr.label}</span>
                    {addr.isDefault ? <Star size={14} className="text-dalle-orange" fill="currentColor" /> : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-neutral-700">{addr.addressText}</p>
                  {addr.commune ? <p className="text-xs text-neutral-500">{addr.commune}{addr.neighborhood ? ` · ${addr.neighborhood}` : ""}</p> : null}
                  {addr.landmarkText ? <p className="text-xs text-neutral-500">Repère : {addr.landmarkText}</p> : null}
                  {addr.phone ? <p className="text-xs text-neutral-500">Tél : {addr.phone}</p> : null}
                  {addr.instructions ? <p className="text-xs text-neutral-500">{addr.instructions}</p> : null}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeAddress(addr.id)}>
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
