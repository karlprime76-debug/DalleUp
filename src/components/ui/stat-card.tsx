import type { ReactNode } from "react";

export function StatCard({ label, value, icon, trend }: { label: string; value: string; icon?: ReactNode; trend?: string }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-dalle-orange/10" />
      <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-dalle-orange/10 text-dalle-orange">{icon}</div>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-dalle-charcoal">{value}</p>
      {trend ? <p className="mt-2 text-xs font-black text-lime-600">{trend}</p> : null}
    </div>
  );
}
