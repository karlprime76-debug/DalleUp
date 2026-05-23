import type { ReactNode } from "react";
import { CartFeedback } from "@/components/cart/cart-feedback";
import { AppHeader } from "@/components/customer/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-dalle-cream pb-24 md:pb-0"><AppHeader /><CartFeedback />{children}<BottomNav /></div>;
}
