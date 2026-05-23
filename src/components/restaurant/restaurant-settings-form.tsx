"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import type { RestaurantSettings } from "@/lib/data/restaurant-settings";

export function RestaurantSettingsForm({ settings }: { settings: RestaurantSettings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(settings.isMock ? "Fallback mock en lecture seule." : null);
  const [imageUrl, setImageUrl] = useState(settings.image);

  async function submit(formData: FormData) {
    if (settings.isMock) {
      setMessage("Modification disponible avec un restaurant Prisma.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const payload = { name: formData.get("name"), description: formData.get("description"), address: formData.get("address"), phone: formData.get("phone"), image: imageUrl, status: formData.get("status"), deliveryFee: Number(formData.get("deliveryFee")), minDelayMin: Number(formData.get("minDelayMin")), maxDelayMin: Number(formData.get("maxDelayMin")) };
    try {
      const response = await fetch("/api/restaurant/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.message ?? "Enregistrement impossible.");
        return;
      }
      setMessage("Paramètres enregistrés.");
      router.refresh();
    } catch {
      setMessage("Base indisponible : paramètres non modifiés.");
    } finally {
      setLoading(false);
    }
  }

  return <form action={submit} className="grid gap-4"><div className="grid gap-4 md:grid-cols-2"><input name="name" defaultValue={settings.name} placeholder="Nom" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><input name="phone" defaultValue={settings.phone} placeholder="Téléphone" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /></div><textarea name="description" defaultValue={settings.description} placeholder="Description" className="min-h-28 rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><input name="address" defaultValue={settings.address} placeholder="Adresse" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><ImageUpload path={`restaurants/${settings.id}/cover`} currentUrl={imageUrl} onUpload={setImageUrl} label="Photo de couverture" /><input name="image" value={imageUrl} readOnly placeholder="URL image" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><select name="status" defaultValue={settings.status} className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold"><option value="APPROVED">Ouvert aux commandes</option><option value="CLOSED">Indisponible aujourd’hui</option></select><div className="grid gap-4 md:grid-cols-3"><input name="deliveryFee" type="number" defaultValue={settings.deliveryFee} placeholder="Frais livraison" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><input name="minDelayMin" type="number" defaultValue={settings.minDelayMin} placeholder="Délai min" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><input name="maxDelayMin" type="number" defaultValue={settings.maxDelayMin} placeholder="Délai max" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /></div>{message ? <p className="text-sm font-bold text-dalle-orange">{message}</p> : null}<Button type="submit" disabled={loading || settings.isMock}>{loading ? "Enregistrement..." : "Enregistrer les paramètres"}</Button></form>;
}
