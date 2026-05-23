import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOpsUsers } from "@/lib/data/ops";


function roleVariant(role: string) {
  if (role === "ADMIN") return "dark";
  if (role === "RESTAURANT") return "orange";
  if (role === "DELIVERY_DRIVER") return "lime";
  return "neutral";
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getOpsUsers();
  return <AdminShell title="Admin Utilisateurs" sections={adminNavSections}><Card className="p-5"><h2 className="text-xl font-black">Utilisateurs</h2><p className="mt-2 text-sm text-neutral-500">Liste Prisma des comptes, avec fallback démo si la DB est indisponible.</p><div className="mt-4 grid gap-3">{users.map((user) => <div key={user.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[1.2fr_1fr_150px_150px_120px]"><div><p className="font-black">{user.name}</p><p className="text-sm text-neutral-500">{user.email}</p></div><p className="text-sm font-bold text-neutral-500">{user.phone}</p><Badge variant={roleVariant(user.role)}>{user.role}</Badge><p className="text-sm font-bold text-neutral-500">{user.driverStatus}</p><p className="text-xs font-bold text-neutral-400">{user.createdAt}</p></div>)}</div></Card></AdminShell>;
}


