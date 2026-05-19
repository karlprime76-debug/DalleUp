import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

const variants = {
  orange: "bg-dalle-orange text-white",
  lime: "bg-dalle-lime text-dalle-charcoal",
  dark: "bg-dalle-charcoal text-white",
  soft: "bg-orange-50 text-dalle-orange",
  neutral: "bg-neutral-100 text-neutral-700"
};

export function Badge({ className, variant = "soft", ...props }: ComponentPropsWithoutRef<"span"> & { variant?: keyof typeof variants }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black", variants[variant], className)} {...props} />;
}
