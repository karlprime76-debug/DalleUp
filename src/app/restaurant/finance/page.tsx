import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRestaurant } from "@/lib/auth/guards";
import { getOpsOrders } from "@/lib/data/ops";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function RestaurantFinancePage() {
  const { session, restaurant } = await requireRestaurant();
  const orders = await getOpsOrders({ restaurantOwnerId: session.user.id });
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const revenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const commission = Math.round(revenue * 0.15);
  const net = revenue - commission;

  return (
    <RestaurantShell title="Finance & Solde" sections={restaurantNavSections}>
      {restaurant.status === "PENDING" ? <div className="mb-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">Votre restaurant est en attente de validation. Les finances apparaîtront après approbation.</div> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Ventes livrées</p><h2 className="mt-2 text-3xl font-black text-dalle-orange">{deliveredOrders.length}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Chiffre d&apos;affaires</p><h2 className="mt-2 text-3xl font-black text-dalle-orange">{formatPrice(revenue)}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Commission DalleUp (15%)</p><h2 className="mt-2 text-3xl font-black">{formatPrice(commission)}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Net restaurant</p><h2 className="mt-2 text-3xl font-black text-dalle-lime">{formatPrice(net)}</h2></Card>
      </div>
      <Card className="mt-6 p-5">
        <h2 className="text-xl font-black">Historique des commandes livrées</h2>
        {deliveredOrders.length ? (
          <div className="mt-4 grid gap-3">
            {deliveredOrders.map((order) => (
              <div key={order.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[120px_1fr_150px_150px]">
                <b>{order.id}</b>
                <div><p>{order.customer}</p><p className="text-sm text-neutral-500">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}</p></div>
                <span className="font-black text-dalle-orange">{formatPrice(order.total)}</span>
                <span className="text-sm font-bold text-neutral-500">Livrée</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5"><EmptyState title="Aucune commande livrée" description="Les commandes livrées apparaîtront ici avec le détail des revenus." /></div>
        )}
      </Card>
    </RestaurantShell>
  );
}
