"use client";

import { useEffect } from "react";

export function HighlightItem({ itemId }: { itemId: string | null }) {
  useEffect(() => {
    if (!itemId) return;
    const element = document.getElementById(`menu-item-${itemId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("ring-2", "ring-dalle-orange", "ring-offset-2", "rounded-[1.75rem]");

    const timer = window.setTimeout(() => {
      element.classList.remove("ring-2", "ring-dalle-orange", "ring-offset-2", "rounded-[1.75rem]");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [itemId]);

  return null;
}
