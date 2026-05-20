import { Home, LogIn } from "lucide-react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4 py-12">
      <Card className="w-full max-w-xl p-8 text-center">
        <Image src="/brand/dalleup-logo-slogan.svg" alt={`${site.name} - ${site.slogan}`} width={220} height={124} className="mx-auto h-auto w-48 rounded-2xl bg-white p-2" priority />
        <p className="mt-6 text-sm font-black uppercase tracking-[0.3em] text-dalle-orange">404</p>
        <h1 className="mt-3 text-4xl font-black text-dalle-charcoal">Page introuvable</h1>
        <p className="mt-3 text-neutral-500">La page demandée n’existe pas ou a été déplacée.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/" variant="dark"><Home size={18} /> Retour accueil</ButtonLink>
          <ButtonLink href="/login" variant="outline"><LogIn size={18} /> Connexion</ButtonLink>
        </div>
      </Card>
    </main>
  );
}
