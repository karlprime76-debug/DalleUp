import Link from "next/link";
import { cn } from "@/lib/cn";

export function CategoryPill({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return <Link href={href} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-black shadow-sm transition", active ? "bg-dalle-charcoal text-white" : "bg-white text-dalle-charcoal hover:bg-dalle-lime")}>{label}</Link>;
}
