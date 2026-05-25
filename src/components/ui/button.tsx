import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "dark" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-dalle-orange text-white shadow-glow hover:bg-orange-600",
  secondary: "bg-dalle-lime text-dalle-charcoal hover:bg-lime-300",
  dark: "bg-dalle-charcoal text-white hover:bg-black",
  ghost: "bg-white/80 text-dalle-charcoal ring-1 ring-black/10 hover:bg-white",
  outline: "bg-transparent text-dalle-charcoal ring-1 ring-black/10 hover:bg-white"
};

const sizes = {
  sm: "rounded-xl px-4 py-2 text-xs",
  md: "rounded-2xl px-5 py-3 text-sm",
  lg: "rounded-3xl px-7 py-4 text-base"
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={cn("inline-flex items-center justify-center gap-2 font-black transition-transform duration-100 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({ href, children, className, variant = "primary", size = "md" }: { href: string; children: ReactNode; className?: string; variant?: ButtonProps["variant"]; size?: ButtonProps["size"] }) {
  return <Link href={href} className={cn("inline-flex items-center justify-center gap-2 font-black transition-transform duration-100 active:scale-[0.98]", variants[variant], sizes[size], className)}>{children}</Link>;
}
