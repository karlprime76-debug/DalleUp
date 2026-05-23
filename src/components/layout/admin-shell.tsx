import type { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";

export function AdminShell({ title, nav, children }: { title: string; nav: { href: string; label: string }[]; children: ReactNode }) {
  return <DashboardShell title={title} nav={nav} logoHref="/admin">{children}</DashboardShell>;
}
