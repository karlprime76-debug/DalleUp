import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { AdminPayoutsClient } from "@/components/admin/admin-payouts-client";

export default function AdminPayoutsPage() {
  return (
    <AdminShell title="Reversements" sections={adminNavSections}>
      <AdminPayoutsClient />
    </AdminShell>
  );
}
