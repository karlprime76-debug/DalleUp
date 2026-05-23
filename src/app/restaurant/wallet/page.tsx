import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { RestaurantWalletClient } from "@/components/restaurant/restaurant-wallet-client";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";

export default function RestaurantWalletPage() {
  return (
    <RestaurantShell title="Mon solde" sections={restaurantNavSections}>
      <RestaurantWalletClient />
    </RestaurantShell>
  );
}
