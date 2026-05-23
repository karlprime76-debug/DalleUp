import type { ReactNode } from "react";
import { DashboardShell, type NavSection } from "./dashboard-shell";

export function AdminShell({ title, nav, sections, children }: { title: string; nav?: { href: string; label: string }[]; sections?: NavSection[]; children: ReactNode }) {
  return <DashboardShell title={title} nav={nav} sections={sections} logoHref="/admin" publicHref="/">{children}</DashboardShell>;
}
