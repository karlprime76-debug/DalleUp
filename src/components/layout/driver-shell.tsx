import type { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";

export function DriverShell({ title, nav, children }: { title: string; nav: { href: string; label: string }[]; children: ReactNode }) {
  return <DashboardShell title={title} nav={nav} logoHref="/driver/dashboard">{children}</DashboardShell>;
}
