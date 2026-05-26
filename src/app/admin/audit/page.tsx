import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminAuditLogs } from "@/lib/data/admin-audit";


function actionVariant(action: string) {
  if (action.includes("EXPORTED")) return "lime";
  if (action.includes("STATUS")) return "orange";
  return "neutral";
}

export default async function AdminAuditPage() {
  await requireAdmin();
  const logs = await getAdminAuditLogs();
  return <AdminShell title="Audit admin" sections={adminNavSections}><Card className="p-5"><h2 className="text-xl font-black">Historique des actions sensibles</h2><p className="mt-2 text-sm text-neutral-500">Journal des changements de statuts et exports financiers.</p><div className="mt-5 grid gap-3">{logs.map((log) => <div key={log.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[180px_220px_1fr_160px]"><div><Badge variant={actionVariant(log.action)}>{log.action}</Badge><p className="mt-2 text-xs font-bold text-neutral-500">{log.createdAt}</p></div><div><p className="font-black">{log.admin}</p><p className="text-sm text-neutral-500">{log.targetType} · {log.targetId}</p></div><div><p className="font-bold">{log.targetLabel}</p><p className="break-all text-xs text-neutral-500">{log.metadata}</p></div><p className="text-xs font-black uppercase text-neutral-400">Journal DB</p></div>)}</div></Card></AdminShell>;
}

