import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaydunyaCancelPage() {
  return <main className="min-h-screen bg-dalle-cream px-4 py-12"><div className="mx-auto max-w-xl"><Card className="p-6 text-center"><p className="font-black text-dalle-orange">Paiement annulé</p><h1 className="mt-2 text-3xl font-black text-dalle-charcoal">La transaction PayDunya n’a pas été finalisée</h1><p className="mt-3 text-neutral-500">Tu peux revenir au panier ou consulter tes commandes pour réessayer plus tard.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><ButtonLink href="/app/cart">Retour au panier</ButtonLink><ButtonLink href="/app/orders" variant="outline">Voir mes commandes</ButtonLink></div></Card></div></main>;
}
