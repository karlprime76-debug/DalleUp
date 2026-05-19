"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MenuItemForm({ item }: { item?: { id?: string; name: string; description: string; price: number; image: string; category: string; isActive: boolean; isMock?: boolean } }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(item?.isMock ? "Donnée mock en lecture seule." : null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    if (item?.isMock) {
      setMessage("Modification disponible avec un plat Prisma.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const payload = { name: formData.get("name"), description: formData.get("description"), price: Number(formData.get("price")), image: formData.get("image"), category: formData.get("category"), isActive: formData.get("isActive") === "on" };
    try {
      const response = await fetch(item?.id ? `/api/restaurant/menu/${item.id}` : "/api/restaurant/menu", { method: item?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.message ?? "Enregistrement impossible.");
        return;
      }
      router.push("/restaurant/menu");
      router.refresh();
    } catch {
      setMessage("Base indisponible : enregistrement impossible.");
    } finally {
      setLoading(false);
    }
  }

  return <form action={submit} className="grid gap-4"><input name="name" defaultValue={item?.name} placeholder="Nom du plat" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><textarea name="description" defaultValue={item?.description} placeholder="Description" className="min-h-28 rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><input name="price" type="number" defaultValue={item?.price} placeholder="Prix FCFA" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><input name="category" defaultValue={item?.category ?? "Menu"} placeholder="Catégorie" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><input name="image" defaultValue={item?.image} placeholder="URL image" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" /><label className="flex items-center gap-3 font-bold"><input name="isActive" type="checkbox" defaultChecked={item?.isActive ?? true} /> Plat actif</label>{message ? <p className="text-sm font-bold text-dalle-orange">{message}</p> : null}<Button type="submit" disabled={loading || item?.isMock}>{loading ? "Enregistrement..." : "Enregistrer"}</Button></form>;
}
