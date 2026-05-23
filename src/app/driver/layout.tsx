import type { ReactNode } from "react";
import { BottomNavDriver } from "@/components/layout/bottom-nav-driver";

export default function DriverLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-neutral-50 pb-24 md:pb-0">{children}<BottomNavDriver /></div>;
}
