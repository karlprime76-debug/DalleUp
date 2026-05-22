import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function PaydunyaReturnPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="min-h-screen bg-dalle-cream px-4 py-12"><div className="mx-auto max-w-xl"><Card className="p-6 text-center"><p className="font-black text-dalle-orange">PayDunya</p><h1 className="mt-2 text-3xl font-black text-dalle-charcoal">Vérification du paiement...</h1><p className="mt-3 text-neutral-500">Le paiement sera confirmé par PayDunya. Ne te fie pas uniquement à cette page de retour.</p>{token ? <p className="mt-3 break-all rounded-2xl bg-neutral-50 p-3 text-xs font-bold text-neutral-500">Token: {token}</p> : null}<div className="mt-6 flex flex-wrap justify-center gap-3"><ButtonLink href="/app/orders">Voir mes commandes</ButtonLink><ButtonLink href="/app/restaurants" variant="outline">Continuer mes achats</ButtonLink></div></Card></div></main>;
}
