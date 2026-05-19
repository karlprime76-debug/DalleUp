import type { ReactNode } from "react";
import { ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function EmptyState({ title, description, actionHref, actionLabel, icon }: { title: string; description: string; actionHref?: string; actionLabel?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-black/10 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-orange-50 text-dalle-orange">{icon ?? <ShoppingBag size={28} />}</div>
      <h2 className="mt-4 text-2xl font-black text-dalle-charcoal">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">{description}</p>
      {actionHref && actionLabel ? <ButtonLink href={actionHref} className="mt-5">{actionLabel}</ButtonLink> : null}
    </div>
  );
}
