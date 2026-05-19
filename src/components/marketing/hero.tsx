import { ArrowRight, Bike, Flame } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="overflow-hidden bg-dalle-charcoal text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-dalle-lime"><Flame size={16} /> New food energy</div>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">{site.name}</h1>
          <p className="mt-4 text-3xl font-black text-dalle-orange md:text-5xl">{site.slogan}</p>
          <p className="mt-6 max-w-xl text-lg text-white/70">{site.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/app" className="gap-2">Commander maintenant <ArrowRight size={18} /></ButtonLink>
            <ButtonLink href="/register?role=RESTAURANT" variant="secondary">Devenir restaurant partenaire</ButtonLink>
            <ButtonLink href="/register?role=DELIVERY_DRIVER" variant="ghost">Devenir livreur</ButtonLink>
          </div>
        </div>
        <div className="relative min-h-[360px] rounded-[2.5rem] bg-gradient-to-br from-dalle-orange to-dalle-lime p-4 shadow-glow">
          <div className="absolute right-6 top-6 rounded-3xl bg-white px-4 py-3 text-sm font-black text-dalle-charcoal">Livré en 28 min</div>
          <div className="absolute bottom-6 left-6 right-6 rounded-[2rem] bg-white p-5 text-dalle-charcoal shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-dalle-charcoal text-dalle-lime"><Bike size={30} /></div>
              <div>
                <p className="text-sm font-bold text-neutral-500">Commande DU-1002</p>
                <p className="text-xl font-black">Pizza Vibe arrive chez toi</p>
              </div>
            </div>
            <div className="mt-5 h-3 rounded-full bg-neutral-100"><div className="h-3 w-3/4 rounded-full bg-dalle-orange" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
