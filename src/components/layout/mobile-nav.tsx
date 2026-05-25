"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="grid h-10 w-10 place-items-center rounded-2xl bg-neutral-100 transition hover:bg-neutral-200"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={`fixed inset-0 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
          role="button"
          tabIndex={open ? 0 : -1}
        />
        <div
          className={`absolute inset-x-0 top-14 border-b border-black/5 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-xl transition-transform duration-300 ${open ? "translate-y-0" : "-translate-y-full"}`}
        >
          <nav className="grid gap-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-dalle-orange hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
