import { requireAdmin } from "@/lib/auth/guards";
import { RoleDashboard } from "@/components/dashboard/role-dashboard";
export default async function Page() { await requireAdmin(); return <RoleDashboard role="admin" title="Admin Dashboard" />; }



