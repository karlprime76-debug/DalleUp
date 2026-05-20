"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4 py-12">
      <Card className="w-full max-w-xl p-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-dalle-orange">DalleUp</p>
        <h1 className="mt-3 text-4xl font-black text-dalle-charcoal">Une erreur est survenue</h1>
        <p className="mt-3 text-neutral-500">Impossible d’afficher cette page pour le moment. Réessaie dans un instant.</p>
        <Button type="button" className="mt-7" variant="dark" onClick={reset}><RotateCcw size={18} /> Réessayer</Button>
      </Card>
    </main>
  );
}
