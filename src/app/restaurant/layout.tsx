import type { ReactNode } from "react";
import { BottomNavRestaurant } from "@/components/layout/bottom-nav-restaurant";

export default function RestaurantLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-neutral-50 pb-24 md:pb-0">{children}<BottomNavRestaurant /></div>;
}
