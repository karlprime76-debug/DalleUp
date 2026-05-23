import { DriverDeliveryDetail } from "@/components/driver/driver-delivery-detail";
import { DriverShell } from "@/components/layout/driver-shell";
import { driverNavSections } from "@/lib/navigation/driver-nav";

export default async function DriverDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DriverShell title="Détail livraison" sections={driverNavSections}>
      <DriverDeliveryDetail orderId={id} />
    </DriverShell>
  );
}
