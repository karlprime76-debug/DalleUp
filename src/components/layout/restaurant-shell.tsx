import type { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";

export function RestaurantShell({ title, nav, children }: { title: string; nav: { href: string; label: string }[]; children: ReactNode }) {
  return <DashboardShell title={title} nav={nav} logoHref="/restaurant/dashboard">{children}</DashboardShell>;
}
