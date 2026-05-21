import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DeliveryPage() {
  return <><SiteHeader /><main className="min-h-screen bg-dalle-cream px-4 py-16"><div className="mx-auto max-w-5xl"><p className="font-black text-dalle-orange">Livreurs</p><h1 className="mt-2 text-4xl font-black text-dalle-charcoal md:text-5xl">Livre avec DalleUp à Cotonou</h1><p className="mt-4 max-w-3xl text-neutral-600">Rejoins une plateforme locale pensée pour connecter restaurants, clients et livreurs avec plus de clarté.</p><div className="mt-8 grid gap-5 md:grid-cols-3"><Card className="p-6"><h2 className="font-black">Missions locales</h2><p className="mt-3 text-sm text-neutral-600">Des livraisons dans les zones actives de Cotonou et environs.</p></Card><Card className="p-6"><h2 className="font-black">Suivi simple</h2><p className="mt-3 text-sm text-neutral-600">Des statuts clairs pour chaque commande et livraison.</p></Card><Card className="p-6"><h2 className="font-black">Croissance progressive</h2><p className="mt-3 text-sm text-neutral-600">Un MVP prêt à évoluer avec plus de zones et d’options.</p></Card></div><ButtonLink href="/register?role=DELIVERY_DRIVER" className="mt-8">Devenir livreur DalleUp</ButtonLink></div></main></>;
}
