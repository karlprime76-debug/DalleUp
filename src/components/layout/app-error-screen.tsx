"use client";

import Link from "next/link";
import { Home, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AppErrorScreenProps = {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function AppErrorScreen({
  error,
  reset,
  title = "Page temporairement indisponible",
  description = "Nous avons détecté un problème technique. Vous pouvez réessayer ou revenir à l'accueil.",
  homeHref = "/",
  homeLabel = "Accueil",
  secondaryHref,
  secondaryLabel,
}: AppErrorScreenProps) {
  if (process.env.NODE_ENV !== "production" && error) {
    console.error("[DalleUp error boundary]", error);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4 py-12">
      <Card className="w-full max-w-xl p-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-dalle-orange">DalleUp</p>
        <h1 className="mt-3 text-3xl font-black text-dalle-charcoal sm:text-4xl">{title}</h1>
        <p className="mt-3 text-neutral-500">{description}</p>
        {error?.digest ? <p className="mt-3 text-xs font-bold text-neutral-400">Référence : {error.digest}</p> : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {reset ? <Button type="button" variant="dark" onClick={reset}><RotateCcw size={18} /> Réessayer</Button> : null}
          <Link href={homeHref} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-dalle-charcoal ring-1 ring-black/10 transition hover:bg-neutral-50"><Home size={18} /> {homeLabel}</Link>
          {secondaryHref && secondaryLabel ? <Link href={secondaryHref} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-dalle-charcoal ring-1 ring-black/10 transition hover:bg-neutral-50"><Settings size={18} /> {secondaryLabel}</Link> : null}
        </div>
      </Card>
    </main>
  );
}
