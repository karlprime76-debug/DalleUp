import { requireRestaurant } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function RestaurantOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session } = await requireRestaurant();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, restaurant: { ownerId: session.user.id } },
    include: { customer: true, items: { include: { menuItem: true } }, payment: true, address: true, delivery: { include: { driver: { select: { name: true, phone: true, vehicleType: true } } } } }
  });

  if (!order) {
    return (
      <DashboardShell title="Commande" nav={[{ href: "/restaurant", label: "Accueil" }, { href: "/restaurant/orders", label: "Commandes" }, { href: "/restaurant/settings", label: "Paramètres" }]}>
        <Card className="p-6">
          <p className="text-neutral-500">Commande introuvable ou vous n’avez pas les droits pour la consulter.</p>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={`Commande ${order.id}`} nav={[{ href: "/restaurant", label: "Accueil" }, { href: "/restaurant/orders", label: "Commandes" }, { href: "/restaurant/settings", label: "Paramètres" }]}>
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={order.status === "DELIVERED" ? "lime" : order.status === "CANCELLED" ? "neutral" : "orange"}>{order.status}</Badge>
          {order.payment ? <Badge variant="soft">{order.payment.status}</Badge> : null}
        </div>
        <p className="mt-3 text-sm text-neutral-500">Client : {order.customer?.name ?? order.customer?.email ?? "—"}</p>
        <p className="mt-1 text-sm text-neutral-500">Adresse : {order.address ? `${order.address.street}, ${order.address.city}${order.address.zone ? ` (${order.address.zone})` : ""}` : "—"}</p>
        <p className="mt-1 text-sm text-neutral-500">Total : {formatPrice(order.total)}</p>
        <p className="mt-1 text-sm text-neutral-500">Date : {order.createdAt.toLocaleString("fr-FR")}</p>
      </Card>

      <Card className="mt-5 p-5">
        <h3 className="text-lg font-black">Livraison</h3>
        {order.delivery ? (
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between"><span>Statut livraison</span><Badge variant={order.delivery.status === "DELIVERED" ? "lime" : order.delivery.status === "FAILED" ? "neutral" : "orange"}>{order.delivery.status}</Badge></div>
            {order.delivery.driver ? (
              <>
                <div className="flex justify-between"><span>Livreur</span><b>{order.delivery.driver.name}</b></div>
                <div className="flex justify-between"><span>Téléphone</span><b>{order.delivery.driver.phone ?? "—"}</b></div>
                <div className="flex justify-between"><span>Véhicule</span><b>{order.delivery.driver.vehicleType ?? "—"}</b></div>
              </>
            ) : (
              <p className="text-neutral-500">Aucun livreur assigné pour le moment.</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">Aucune livraison associée.</p>
        )}
      </Card>

      <Card className="mt-5 p-5">
        <h3 className="text-lg font-black">Produits commandés</h3>
        {order.items.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Aucun produit dans cette commande.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-2xl bg-neutral-50 p-3 text-sm">
                <span className="font-black">{item.menuItem?.name ?? "Produit"}</span> · {formatPrice(item.unitPrice)} · x{item.quantity}
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
