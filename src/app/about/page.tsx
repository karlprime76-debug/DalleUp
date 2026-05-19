import { SiteHeader } from "@/components/layout/site-header";

export default function AboutPage() {
  return <><SiteHeader /><main className="min-h-screen bg-dalle-cream px-4 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-sm"><h1 className="text-4xl font-black">À propos de DalleUp</h1><p className="mt-4 text-neutral-600">DalleUp connecte clients, restaurants et livreurs avec une expérience mobile-first rapide, moderne et locale.</p></div></main></>;
}
