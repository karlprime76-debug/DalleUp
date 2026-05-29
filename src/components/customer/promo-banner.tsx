import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";

export function PromoBanner({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <Link href="/app/restaurants" className="relative block overflow-hidden rounded-[2rem] bg-dalle-charcoal p-5 text-white shadow-glow">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-dalle-orange/80 blur-2xl" />
      <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-dalle-lime/70 blur-2xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-dalle-lime"><Flame size={14} /> En ce moment</span>
          <h2 className="mt-3 text-2xl font-black">{title ?? "Decouvrez les restaurants pres de chez vous"}</h2>
          <p className="mt-1 text-sm text-white/70">{subtitle ?? "Commandez local, savourez frais."}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-dalle-orange"><ArrowRight size={20} /></span>
      </div>
    </Link>
  );
}
