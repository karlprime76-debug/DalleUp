import { DriverDeliveryDetail } from "@/components/driver/driver-delivery-detail";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const nav = [
  { href: "/driver/dashboard", label: "Accueil" },
  { href: "/driver/deliveries", label: "Livraisons" },
  { href: "/driver/earnings", label: "Gains" },
];

export default async function DriverDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardShell title="Détail Livraison" nav={nav}>
      <DriverDeliveryDetail orderId={id} />
    </DashboardShell>
  );
}
