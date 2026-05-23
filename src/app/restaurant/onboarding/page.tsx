"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { site } from "@/lib/site";

export default function RestaurantOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      image: formData.get("image"),
      deliveryFee: Number(formData.get("deliveryFee")),
      minDelayMin: Number(formData.get("minDelayMin")),
      maxDelayMin: Number(formData.get("maxDelayMin")),
    };

    try {
      const res = await fetch("/api/restaurant/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Erreur lors de la création.");
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

  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" aria-label="Retour à l'accueil" className="mb-6 inline-flex items-center gap-2 font-black text-dalle-charcoal">
          <Image src="/brand/dalleup-icon.svg" alt="DalleUp" width={32} height={32} className="rounded-xl shadow-sm" priority />
          <span>{site.name}</span>
        </Link>
        <Card className="p-8">
          <p className="text-sm font-black text-dalle-orange">Restaurant partenaire</p>
          <h1 className="mt-2 text-3xl font-black">Créer mon restaurant</h1>
          <p className="mt-3 text-neutral-500">Complétez les informations de votre établissement pour commencer à recevoir des commandes.</p>

          {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" required placeholder="Nom du restaurant" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" />
              <input name="phone" placeholder="Téléphone" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" />
            </div>
            <textarea name="description" required placeholder="Description (type de cuisine, ambiance...)" className="min-h-24 rounded-2xl bg-neutral-50 px-4 py-3 font-bold" />
            <input name="address" required placeholder="Adresse complète / quartier" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" />
            <input name="image" placeholder="URL photo de couverture (optionnel)" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" />
            <div className="grid gap-4 md:grid-cols-3">
              <input name="deliveryFee" type="number" defaultValue={1200} placeholder="Frais livraison" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" />
              <input name="minDelayMin" type="number" defaultValue={20} placeholder="Délai min (min)" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" />
              <input name="maxDelayMin" type="number" defaultValue={40} placeholder="Délai max (min)" className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold" />
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Création..." : "Créer mon restaurant"}
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
