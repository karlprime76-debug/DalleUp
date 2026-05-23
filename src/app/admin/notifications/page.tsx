import { requireAdmin } from "@/lib/auth/guards";
import { AdminNotificationStatusActions } from "@/components/admin/admin-notification-status-actions";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBillingNotifications } from "@/lib/data/billing-notifications";

const statuses = ["ALL", "PENDING", "SENT", "FAILED"];
const types = ["ALL", "SUBSCRIPTION_UPDATED", "INVOICE_GENERATED", "INVOICE_PAID", "INVOICE_STATUS_UPDATED"];

function statusVariant(status: string) {
  if (status === "SENT") return "lime";
  if (status === "FAILED") return "orange";
  return "neutral";
}

export default async function AdminNotificationsPage({ searchParams }: { searchParams?: Promise<{ status?: string; type?: string }> }) {
  await requireAdmin();
  const filters = await searchParams;
  const status = statuses.includes(filters?.status ?? "") ? filters?.status ?? "ALL" : "ALL";
  const type = types.includes(filters?.type ?? "") ? filters?.type ?? "ALL" : "ALL";
  const notifications = await getBillingNotifications({ status, type });
  const exportHref = `/api/admin/notifications/export?status=${status}&type=${type}`;
  return <AdminShell title="Notifications billing" sections={adminNavSections}><Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">Notifications financières</h2><p className="mt-2 text-sm text-neutral-500">Suivi interne des notifications liées aux abonnements, factures et paiements.</p></div><ButtonLink href={exportHref} size="sm" variant="dark">Exporter CSV</ButtonLink></div><div className="mt-5 flex flex-wrap gap-2"><span className="text-xs font-black uppercase text-neutral-500">Statut</span>{statuses.map((item) => <ButtonLink key={item} href={`/admin/notifications?status=${item}&type=${type}`} size="sm" variant={item === status ? "secondary" : "outline"}>{item}</ButtonLink>)}<span className="ml-2 text-xs font-black uppercase text-neutral-500">Type</span>{types.map((item) => <ButtonLink key={item} href={`/admin/notifications?status=${status}&type=${item}`} size="sm" variant={item === type ? "secondary" : "outline"}>{item}</ButtonLink>)}</div><div className="mt-5 grid gap-3">{notifications.length ? notifications.map((notification) => <div key={notification.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 xl:grid-cols-[180px_1fr_220px]"><div><Badge variant={statusVariant(notification.status)}>{notification.status}</Badge><p className="mt-2 text-xs font-black text-neutral-500">{notification.type}</p></div><div><p className="font-black">{notification.title}</p><p className="text-sm text-neutral-600">{notification.message}</p><p className="mt-1 break-all text-xs font-bold text-neutral-400">{notification.restaurant} · {notification.metadata}</p></div><div className="grid gap-3 text-xs font-bold text-neutral-500"><div><p>Créée : {notification.createdAt}</p><p>Envoyée : {notification.sentAt}</p>{notification.isMock ? <p className="mt-2 text-dalle-orange">Fallback mock</p> : null}</div><AdminNotificationStatusActions notificationId={notification.id} currentStatus={notification.status} disabled={notification.isMock} /></div></div>) : <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">Aucune notification ne correspond aux filtres.</div>}</div></Card></AdminShell>;
}

