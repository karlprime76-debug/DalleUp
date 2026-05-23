import Link from "next/link";
import Image from "next/image";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { site } from "@/lib/site";

export default function DriverSuspendedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4">
      <div className="absolute left-4 top-4"><Link href="/" aria-label="Retour à l'accueil" className="flex items-center gap-2 font-black text-dalle-charcoal"><Image src="/brand/dalleup-icon.svg" alt={`${site.name} logo`} width={36} height={36} className="rounded-2xl shadow-sm" priority /><span className="hidden sm:inline">{site.name}</span></Link></div>
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-orange-50 text-dalle-orange">
          <ShieldAlert size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-dalle-charcoal">Compte suspendu.</h1>
        <p className="mt-3 text-neutral-500">Votre compte livreur a été suspendu. Contactez le support pour plus d’informations.</p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </Card>
    </main>
  );
}
