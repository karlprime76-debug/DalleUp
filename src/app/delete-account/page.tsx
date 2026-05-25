"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Impossible de supprimer le compte.");
        setLoading(false);
        return;
      }
      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setError("Service indisponible. Réessayez.");
      setLoading(false);
    }
  }

  const confirmed = confirmText === "SUPPRIMER";

  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="text-sm font-black text-dalle-orange">← Accueil</Link>
        <Card className="mt-6 p-8">
          <h1 className="text-3xl font-black text-dalle-charcoal">Supprimer mon compte</h1>
          <p className="mt-3 text-neutral-600">
            Cette action est irréversible. Toutes vos données personnelles, commandes, et préférences seront définitivement supprimées.
          </p>

          {error ? (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>
          ) : null}

          <div className="mt-6 grid gap-3">
            <label className="text-sm font-black text-dalle-charcoal">Tapez SUPPRIMER pour confirmer</label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="rounded-2xl bg-neutral-50 px-4 py-3 font-bold outline-none ring-dalle-orange/20 transition focus:ring-4"
            />
          </div>

          <Button
            onClick={handleDelete}
            disabled={!confirmed || loading}
            className="mt-5 w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? "Suppression en cours..." : "Supprimer définitivement mon compte"}
          </Button>

          <p className="mt-4 text-xs text-neutral-500">
            Conformément au RGPD, vous avez le droit de demander la suppression de vos données. Si vous rencontrez un problème, contactez le support.
          </p>
        </Card>
      </div>
    </main>
  );
}
