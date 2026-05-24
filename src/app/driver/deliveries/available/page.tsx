import { DriverShell } from "@/components/layout/driver-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireApprovedDriver } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { driverNavSections } from "@/lib/navigation/driver-nav";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function DriverAvailableDeliveriesPage() {
  const { user } = await requireApprovedDriver();

  if (user.driverStatus !== "AVAILABLE") {
    return (
      <DriverShell title="Livraisons disponibles" sections={driverNavSections}>
        <Card className="p-5">
          <p className="font-black text-dalle-orange">Vous n&apos;êtes pas disponible</p>
          <p className="mt-2 text-sm text-neutral-500">Activez votre statut &quot;Disponible&quot; dans votre profil pour voir les livraisons proposées.</p>
        </Card>
      </DriverShell>
    );
  }

  const deliveries = await prisma.delivery.findMany({
    where: { status: "PENDING", driverId: null },
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          deliveryFee: true,
          note: true,
          restaurant: { select: { name: true, address: true } },
          address: { select: { street: true, city: true, zone: true } },
        }
      }
    },
    take: 50,
  });

  return (
    <DriverShell title="Livraisons disponibles" sections={driverNavSections}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Disponibles</p>
          <h2 className="mt-2 text-3xl font-black text-dalle-lime">{deliveries.length}</h2>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Mon statut</p>
          <h2 className="mt-2 text-xl font-black text-dalle-orange">{user.driverStatus}</h2>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Gain estimé moyen</p>
          <h2 className="mt-2 text-xl font-black">{formatPrice(Math.round(deliveries.reduce((s, d) => s + (d.order?.deliveryFee ?? 0), 0) / (deliveries.length || 1)))}</h2>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="text-xl font-black">Livraisons disponibles</h2>
        {deliveries.length ? (
          <div className="mt-4 grid gap-3">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[1fr_150px_120px_120px]">
                <div>
                  <p className="font-black">{delivery.order?.restaurant?.name ?? "Restaurant"}</p>
                  <p className="text-sm text-neutral-500">{delivery.order?.restaurant?.address ?? "Adresse restaurant"}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {delivery.order?.address ? `${delivery.order.address.street}, ${delivery.order.address.city}` : "Adresse client"}
                    {delivery.order?.address?.zone ? ` · ${delivery.order.address.zone}` : ""}
                  </p>
                  {delivery.order?.note ? <p className="mt-1 text-xs font-bold text-neutral-600">{delivery.order.note}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neutral-500">Frais livraison</p>
                  <p className="font-black text-dalle-orange">{formatPrice(delivery.order?.deliveryFee ?? 0)}</p>
                </div>
                <Badge variant="lime" className="h-fit">PENDING</Badge>
                <ButtonLink href={`/driver/deliveries/${delivery.id}`} size="sm" variant="dark">Détail</ButtonLink>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState title="Aucune livraison disponible" description="Revenez plus tard ou restez à l'écoute des notifications." />
          </div>
        )}
      </Card>
    </DriverShell>
  );
}
