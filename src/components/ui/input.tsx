import type { ComponentPropsWithoutRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn("w-full rounded-3xl border border-black/5 bg-white px-5 py-4 text-sm font-semibold outline-none shadow-sm transition placeholder:text-neutral-400 focus:border-dalle-orange focus:ring-4 focus:ring-dalle-orange/10", className)} {...props} />;
}

export function SearchInput({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
      <Input className="pl-12" {...props} />
    </div>
  );
}
