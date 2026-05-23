import type { ReactNode } from "react";
import { DashboardShell, type NavSection } from "./dashboard-shell";

export function RestaurantShell({ title, nav, sections, children }: { title: string; nav?: { href: string; label: string }[]; sections?: NavSection[]; children: ReactNode }) {
  return <DashboardShell title={title} nav={nav} sections={sections} logoHref="/restaurant/dashboard" publicHref="/">{children}</DashboardShell>;
}
