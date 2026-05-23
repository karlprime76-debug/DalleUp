import { DriverShell } from "@/components/layout/driver-shell";
import { DriverWalletClient } from "@/components/driver/driver-wallet-client";
import { driverNavSections } from "@/lib/navigation/driver-nav";

export default function DriverWalletPage() {
  return (
    <DriverShell title="Mon solde" sections={driverNavSections}>
      <DriverWalletClient />
    </DriverShell>
  );
}
