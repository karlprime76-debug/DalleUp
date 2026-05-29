"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/hooks/use-image-upload";
import { productCategoryOptions } from "@/lib/catalog/product-types";

export function MenuItemForm({ item }: { item?: { id?: string; name: string; description: string; price: number; image: string; category: string; isActive: boolean } }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(item?.image ?? "");
  const [selectedCategory, setSelectedCategory] = useState(item?.category ?? "Plat");
  const { upload, uploading, error: uploadError } = useImageUpload();

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choisissez une image valide.");
      event.target.value = "";
      return;
    }
    const result = await upload(file, "product", item?.id);
    if (result.url) setImageUrl(result.url);
    if (result.error) setMessage(result.error);
    event.target.value = "";
  }

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const payload = { name: formData.get("name"), description: formData.get("description"), price: Number(formData.get("price")), image: imageUrl, category: formData.get("category"), isActive: formData.get("isActive") === "on" };
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

  return (
    <form action={submit} className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-black text-dalle-charcoal" htmlFor="name">Nom du produit</label>
        <input id="name" name="name" required defaultValue={item?.name} placeholder="Ex : Burger poulet, Riz au gras, Jus de bissap" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
        <p className="text-xs font-bold text-neutral-400">Le nom affiché aux clients dans le menu.</p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-black text-dalle-charcoal" htmlFor="description">Description</label>
        <textarea id="description" name="description" required defaultValue={item?.description} placeholder="Décrivez les ingrédients, la portion, les accompagnements inclus..." className="min-h-28 rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
        <p className="text-xs font-bold text-neutral-400">Aide le client à comprendre ce qu’il commande.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-black text-dalle-charcoal" htmlFor="price">Prix de vente</label>
          <div className="flex items-center rounded-2xl bg-neutral-50 px-4 py-3 ring-dalle-orange/20 focus-within:ring-4">
            <input id="price" name="price" type="number" min="1" step="1" required defaultValue={item?.price} placeholder="2500" className="w-full bg-transparent font-bold outline-none" />
            <span className="text-sm font-black text-neutral-400">FCFA</span>
          </div>
          <p className="text-xs font-bold text-neutral-400">Prix payé par le client, hors frais de livraison.</p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-black text-dalle-charcoal" htmlFor="category">Catégorie</label>
          <select id="category" name="category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4">
            {productCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <p className="text-xs font-bold text-neutral-400">Permet de ranger le produit dans le menu.</p>
        </div>
      </div>

      {selectedCategory === "Alcool" ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">Produit soumis à restriction. Vérification d’âge requise.</p> : null}

      <div className="grid gap-2">
        <label className="text-sm font-black text-dalle-charcoal">Photo du produit</label>
        <div className="grid gap-4 rounded-3xl bg-neutral-50 p-4 sm:grid-cols-[120px_1fr] sm:items-center">
          <div className="h-28 rounded-2xl bg-white bg-cover bg-center ring-1 ring-black/5" style={{ backgroundImage: `url(${imageUrl || "/placeholder.svg"})` }} />
          <div>
            <input id="image" type="file" accept="image/*" onChange={handleImageChange} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold ring-1 ring-black/10 file:mr-3 file:rounded-xl file:border-0 file:bg-dalle-orange file:px-3 file:py-2 file:text-sm file:font-black file:text-white" />
            <input name="image" type="hidden" value={imageUrl} />
            <p className="mt-2 text-xs font-bold text-neutral-400">{uploading ? "Upload de l’image en cours..." : "Choisissez une photo depuis la galerie ou l’appareil photo."}</p>
            {uploadError ? <p className="mt-2 text-xs font-bold text-red-600">{uploadError}</p> : null}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3 font-bold">
        <input name="isActive" type="checkbox" defaultChecked={item?.isActive ?? true} />
        Produit disponible à la vente
      </label>

      {message ? <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">{message}</p> : null}
      <Button type="submit" disabled={loading || uploading}>{loading ? "Enregistrement..." : uploading ? "Upload en cours..." : "Enregistrer le produit"}</Button>
    </form>
  );
}
