import { requireApprovedDriver } from "@/lib/auth/guards";
import { RoleDashboard } from "@/components/dashboard/role-dashboard";
export default async function Page() {
  await requireApprovedDriver();
  return <RoleDashboard role="driver" title="Tableau de bord livreur" />;
}
