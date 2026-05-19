import type { ReactNode } from "react";
import { CartFeedback } from "@/components/cart/cart-feedback";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-dalle-cream pb-24 md:pb-0"><CartFeedback />{children}<BottomNav /></div>;
}
