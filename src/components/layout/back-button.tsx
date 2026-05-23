"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BackButton({ href, label = "Retour" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href ?? "/app"}
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-200"
    >
      <ArrowLeft size={18} />
      {label}
    </Link>
  );
}
