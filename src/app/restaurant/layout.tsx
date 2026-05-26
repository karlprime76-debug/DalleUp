import type { ReactNode } from "react";
import { BottomNavRestaurant } from "@/components/layout/bottom-nav-restaurant";

export default function RestaurantLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-neutral-50 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0">{children}<BottomNavRestaurant /></div>;
}
