import Link from "next/link";
import { DriverShell } from "@/components/layout/driver-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireApprovedDriver } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { driverNavSections } from "@/lib/navigation/driver-nav";
export default async function DriverDeliveriesPage() {
  const { session } = await requireApprovedDriver();
  const deliveries = (await prisma.delivery.findMany({
    where: { driverId: session.user.id },
    include: { order: { select: { id: true, orderNumber: true, total: true, status: true, note: true, restaurant: { select: { name: true } }, address: { select: { street: true, city: true } } } } },
  }).catch(() => [])) as unknown as Array<{
    id: string;
    orderId: string;
    status: string;
    order: {
      orderNumber: string | null;
      total: number;
      restaurant: { name: string } | null;
      address: { street: string; city: string } | null;
      note: string | null;
    } | null;
  }>;

  const pending = deliveries.filter((d) => d.status === "ASSIGNED");
  const active = deliveries.filter((d) => ["PICKED_UP", "ON_THE_WAY"].includes(d.status));
  const completed = deliveries.filter((d) => d.status === "DELIVERED");
  const failed = deliveries.filter((d) => d.status === "FAILED");

  const sections = [
    { key: "pending", label: "En attente", items: pending },
    { key: "active", label: "En cours", items: active },
    { key: "completed", label: "Terminées", items: completed },
    { key: "failed", label: "Annulées", items: failed },
  ];

  return (
    <DriverShell title="Mes livraisons" sections={driverNavSections}>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">En attente</p><h2 className="mt-2 text-3xl font-black text-dalle-orange">{pending.length}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">En cours</p><h2 className="mt-2 text-3xl font-black text-dalle-orange">{active.length}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Terminées</p><h2 className="mt-2 text-3xl font-black text-dalle-lime">{completed.length}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Annulées</p><h2 className="mt-2 text-3xl font-black">{failed.length}</h2></Card>
      </div>

      {sections.map((section) => (
        <Card key={section.key} className="mt-5 p-5">
          <h2 className="text-xl font-black">{section.label}</h2>
          {section.items.length ? (
            <div className="mt-4 grid gap-3">
              {section.items.map((delivery) => (
                <div key={delivery.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[120px_1fr_150px_120px]">
                  <b>{delivery.order?.orderNumber ?? delivery.orderId.slice(0, 8)}</b>
                  <div>
                    <p>{delivery.order?.restaurant?.name ?? "Restaurant"} · {delivery.order?.address ? `${delivery.order.address.street}, ${delivery.order.address.city}` : "Adresse"}</p>
                    {delivery.order?.note ? <p className="mt-1 text-sm font-bold text-neutral-600">{delivery.order.note}</p> : null}
                  </div>
                  <Badge variant={section.key === "completed" ? "lime" : section.key === "failed" ? "neutral" : "orange"}>{delivery.status}</Badge>
                  <Link href={`/driver/deliveries/${delivery.orderId}`} className="rounded-2xl bg-dalle-charcoal px-4 py-2 text-center text-sm font-black text-white transition hover:bg-black">Détail</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5"><EmptyState title={`Aucune livraison ${section.label.toLowerCase()}`} description="Les livraisons apparaîtront ici." /></div>
          )}
        </Card>
      ))}
    </DriverShell>
  );
}
