import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getAdminComplianceData } from "@/lib/data/admin-compliance";


function severityVariant(severity: string) {
  if (severity === "high") return "orange";
  if (severity === "medium") return "neutral";
  return "lime";
}

export default async function AdminCompliancePage() {
  await requireAdmin();
  const compliance = await getAdminComplianceData();
  return <AdminShell title="Conformité admin" sections={adminNavSections}><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6"><StatCard label="Logs audit" value={String(compliance.auditCount)} /><StatCard label="Actions 7j" value={String(compliance.sensitiveActions7d)} /><StatCard label="Exports financiers" value={String(compliance.financialExports)} /><StatCard label="Exports notifications" value={String(compliance.notificationExports)} /><StatCard label="Notifications attente" value={String(compliance.pendingNotifications)} /><StatCard label="Notifications échec" value={String(compliance.failedNotifications)} /></div>{compliance.isMock ? <Card className="mt-5 border-dashed p-4 text-sm font-bold text-dalle-orange">Fallback mock : applique la migration audit/notifications pour activer les données réelles.</Card> : null}<div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]"><Card className="p-5"><h2 className="text-xl font-black">Dernières actions sensibles</h2><div className="mt-4 grid gap-3">{compliance.recentActions.length ? compliance.recentActions.map((action) => <div key={action.id} className="rounded-2xl bg-neutral-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{action.action}</b><span className="text-xs font-bold text-neutral-500">{action.createdAt}</span></div><p className="mt-1 text-sm text-neutral-600">{action.actor} · {action.target}</p>{action.isMock ? <p className="mt-2 text-xs font-black text-dalle-orange">Fallback mock</p> : null}</div>) : <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">Aucune action sensible récente.</div>}</div></Card><Card className="p-5"><h2 className="text-xl font-black">Points de vigilance</h2><div className="mt-4 grid gap-3">{compliance.issues.length ? compliance.issues.map((issue) => <div key={issue.id} className="rounded-2xl bg-neutral-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{issue.title}</b><Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge></div><p className="mt-1 text-sm text-neutral-600">{issue.detail}</p><p className="mt-2 text-xs font-bold text-neutral-400">{issue.createdAt}</p></div>) : <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">Aucun point critique détecté.</div>}</div></Card></div></AdminShell>;
}
