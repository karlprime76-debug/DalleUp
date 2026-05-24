"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useImageUpload } from "@/hooks/use-image-upload";
import { site } from "@/lib/site";

interface RestaurantData {
  name: string;
  description: string;
  address: string;
  phone: string;
  image: string;
  deliveryFee: number;
  minDelayMin: number;
  maxDelayMin: number;
}

export default function RestaurantOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [initial, setInitial] = useState<RestaurantData>({ name: "", description: "", address: "", phone: "", image: "", deliveryFee: 1200, minDelayMin: 20, maxDelayMin: 40 });
  const [imageUrl, setImageUrl] = useState("");
  const { upload, uploading, error: uploadError } = useImageUpload();

  useEffect(() => {
    fetch("/api/restaurant/onboarding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.restaurant) {
          setInitial({
            name: data.restaurant.name ?? "",
            description: data.restaurant.description ?? "",
            address: data.restaurant.address ?? "",
            phone: data.restaurant.phone ?? "",
            image: data.restaurant.image ?? "",
            deliveryFee: data.restaurant.deliveryFee ?? 1200,
            minDelayMin: data.restaurant.minDelayMin ?? 20,
            maxDelayMin: data.restaurant.maxDelayMin ?? 40,
          });
          setImageUrl(data.restaurant.image ?? "");
        }
      })
      .catch(() => null);
  }, []);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choisissez une image valide.");
      return;
    }
    setError(null);
    setNotice(null);
    const extension = file.name.split(".").pop() || "jpg";
    const safeName = `cover-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const result = await upload(file, `restaurants/covers/${safeName}`);
    if (result.url) setImageUrl(result.url);
    if (result.error) setNotice(result.error);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      address: formData.get("address"),
      phone: formData.get("phone"),
      image: imageUrl,
      deliveryFee: Number(formData.get("deliveryFee")),
      minDelayMin: Number(formData.get("minDelayMin")),
      maxDelayMin: Number(formData.get("maxDelayMin")),
    };

    try {
      const res = await fetch("/api/restaurant/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = data?.error && data?.code ? `(${data.code}) ${data.error}` : "";
        setError((data?.message ?? "Erreur lors de la mise à jour.") + (detail ? ` ${detail}` : ""));
        setLoading(false);
        return;
      }
      router.push("/restaurant/dashboard");
      router.refresh();
    } catch {
      setError("Service indisponible. Réessayez.");
      setLoading(false);
    }
  }

  const isConfigured = initial.name && initial.description && initial.address && initial.address !== "Non renseigné";

  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4 py-10 pb-32">
      <div className="w-full max-w-xl">
        <Link href="/" aria-label="Retour à l'accueil" className="mb-6 inline-flex items-center gap-2 font-black text-dalle-charcoal">
          <Image src="/brand/dalleup-icon.svg" alt="DalleUp" width={32} height={32} className="rounded-xl shadow-sm" priority />
          <span>{site.name}</span>
        </Link>
        <Card className="p-8">
          <p className="text-sm font-black text-dalle-orange">Restaurant partenaire</p>
          <h1 className="mt-2 text-3xl font-black">{isConfigured ? "Modifier mon restaurant" : "Configurer mon restaurant"}</h1>
          <p className="mt-3 text-neutral-500">Complétez les informations de votre établissement pour commencer à recevoir des commandes.</p>

          {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}
          {notice ? <div className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">{notice}</div> : null}
          {uploadError ? <div className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">{uploadError}</div> : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4" key={initial.name}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-black text-dalle-charcoal" htmlFor="name">Nom du restaurant *</label>
                <input id="name" name="name" required defaultValue={initial.name} placeholder="Ex : Chez Aïcha, Burger House" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-black text-dalle-charcoal" htmlFor="phone">Téléphone restaurant</label>
                <input id="phone" name="phone" type="tel" defaultValue={initial.phone} placeholder="Ex : +229 01 00 00 00 00" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-black text-dalle-charcoal" htmlFor="description">Description du restaurant *</label>
              <textarea id="description" name="description" required defaultValue={initial.description} placeholder="Type de cuisine, spécialités, ambiance, plats populaires..." className="min-h-24 rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
              <p className="text-xs font-bold text-neutral-400">Cette description sera visible par les clients.</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-black text-dalle-charcoal" htmlFor="address">Adresse / quartier *</label>
              <input id="address" name="address" required defaultValue={initial.address} placeholder="Ex : Fidjrossè, rue après pharmacie..." className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-black text-dalle-charcoal">Photo de couverture (optionnel)</label>
              <div className="grid gap-4 rounded-3xl bg-neutral-50 p-4 sm:grid-cols-[140px_1fr] sm:items-center">
                <div className="h-32 rounded-2xl bg-white bg-cover bg-center ring-1 ring-black/5" style={{ backgroundImage: `url(${imageUrl || "/placeholder.svg"})` }} />
                <div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold ring-1 ring-black/10 file:mr-3 file:rounded-xl file:border-0 file:bg-dalle-orange file:px-3 file:py-2 file:text-sm file:font-black file:text-white" />
                  <input name="image" type="hidden" value={imageUrl} />
                  <p className="mt-2 text-xs font-bold text-neutral-400">{uploading ? "Upload de l'image en cours..." : "Vous pourrez ajouter une photo plus tard. Ce n'est pas obligatoire pour créer votre restaurant."}</p>
                  {imageUrl ? (
                    <button type="button" onClick={() => { setImageUrl(""); setNotice(null); }} className="mt-2 text-xs font-bold text-dalle-orange underline">Retirer la photo</button>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-black text-dalle-charcoal" htmlFor="deliveryFee">Frais livraison</label>
                <input id="deliveryFee" name="deliveryFee" type="number" min="0" defaultValue={initial.deliveryFee} placeholder="1200" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-black text-dalle-charcoal" htmlFor="minDelayMin">Délai min</label>
                <input id="minDelayMin" name="minDelayMin" type="number" min="1" defaultValue={initial.minDelayMin} placeholder="20" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-black text-dalle-charcoal" htmlFor="maxDelayMin">Délai max</label>
                <input id="maxDelayMin" name="maxDelayMin" type="number" min="1" defaultValue={initial.maxDelayMin} placeholder="40" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4" />
              </div>
            </div>
            <p className="text-xs font-bold text-neutral-400">Les délais sont en minutes. Les frais sont en FCFA.</p>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Enregistrement..." : isConfigured ? "Mettre à jour" : "Enregistrer mon restaurant"}
            </Button>
            <p className="text-center text-sm text-neutral-500">
              Votre restaurant sera soumis à validation avant d&apos;apparaître publiquement.
            </p>
          </form>
        </Card>
      </div>
    </main>
  );
}
