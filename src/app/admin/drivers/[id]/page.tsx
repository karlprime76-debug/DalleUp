import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { DriverStatusActions } from "@/components/ops/driver-status-actions";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/pricing/delivery";
import { prisma } from "@/lib/db/prisma";

function statusVariant(status: string) {
  if (status === "AVAILABLE") return "lime";
  if (status === "SUSPENDED" || status === "REJECTED") return "orange";
  return "neutral";
}

export default async function AdminDriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const driver = await prisma.user.findFirst({
    where: { id, role: "DELIVERY_DRIVER" },
    include: { _count: { select: { deliveries: true } } }
  });
  if (!driver) notFound();

  const deliveries = await prisma.delivery.findMany({
    where: { driverId: driver.id },
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          deliveryFee: true,
          status: true,
          restaurant: { select: { name: true, address: true } },
          address: { select: { street: true, city: true } }
        }
      }
    },
    take: 50
  });

  const completed = deliveries.filter((d) => d.status === "DELIVERED");
  const active = deliveries.filter((d) => !["DELIVERED", "FAILED"].includes(d.status));

  return (
    <AdminShell title={`Livreur : ${driver.name}`} sections={adminNavSections}>
      <Link href="/admin/drivers" className="inline-flex items-center gap-1 text-sm font-bold text-neutral-500 hover:text-dalle-orange">
        <ArrowLeft size={16} /> Retour aux livreurs
      </Link>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <Card className="p-5">
            <h2 className="text-xl font-black">Informations</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span>Nom</span><b>{driver.name}</b></div>
              <div className="flex justify-between"><span>Email</span><b>{driver.email}</b></div>
              <div className="flex justify-between"><span>Téléphone</span><b>{driver.phone ?? "—"}</b></div>
              <div className="flex justify-between"><span>Ville / zone</span><b>{driver.city ?? "—"}</b></div>
              <div className="flex justify-between"><span>Véhicule</span><b>{driver.vehicleType ?? "—"}</b></div>
              <div className="flex justify-between"><span>Inscrit le</span><b>{driver.createdAt.toLocaleDateString("fr-FR")}</b></div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-black">Actions admin</h2>
            <div className="mt-4">
              <DriverStatusActions driverId={driver.id} />
            </div>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card className="h-fit p-5">
            <h2 className="text-xl font-black">Résumé</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span>Statut</span><Badge variant={statusVariant(driver.driverStatus)}>{driver.driverStatus}</Badge></div>
              <div className="flex justify-between"><span>Livraisons totales</span><b>{deliveries.length}</b></div>
              <div className="flex justify-between"><span>Terminées</span><b className="text-dalle-lime">{completed.length}</b></div>
              <div className="flex justify-between"><span>Actives</span><b className="text-dalle-orange">{active.length}</b></div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="text-xl font-black">Livraisons ({deliveries.length})</h2>
        {deliveries.length === 0 ? (
          <div className="mt-5"><EmptyState title="Aucune livraison" description="Ce livreur n'a pas encore effectué de livraison." /></div>
        ) : (
          <div className="mt-4 grid gap-3">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[1fr_120px_140px_140px]">
                <div>
                  <p className="font-black">{delivery.order?.orderNumber ?? delivery.id.slice(0, 8)}</p>
                  <p className="text-sm text-neutral-500">{delivery.order?.restaurant?.name ?? "—"}</p>
                  <p className="text-xs text-neutral-400">{delivery.order?.address ? `${delivery.order.address.street}, ${delivery.order.address.city}` : "—"}</p>
                </div>
                <Badge variant={delivery.status === "DELIVERED" ? "lime" : delivery.status === "FAILED" ? "neutral" : "orange"}>{delivery.status}</Badge>
                <p className="font-black text-dalle-orange">{formatPrice(delivery.order?.total ?? 0)}</p>
                <p className="text-xs font-bold text-neutral-500">Frais {formatPrice(delivery.order?.deliveryFee ?? 0)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
