import { notFound } from "next/navigation";
import { MapPin, AlertTriangle, Lightbulb } from "lucide-react";
import { DeliveryActions } from "@/components/driver/delivery-actions";
import { DriverShell } from "@/components/layout/driver-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireApprovedDriver } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { driverNavSections } from "@/lib/navigation/driver-nav";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function DriverDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { session } = await requireApprovedDriver();
  const { id } = await params;

  const delivery = await prisma.delivery.findFirst({
    where: { id },
    include: {
      order: {
        include: {
          restaurant: true,
          address: true,
          customer: { select: { name: true, phone: true } },
          items: { include: { menuItem: true } },
          payment: true,
        }
      },
      driver: { select: { id: true, name: true } }
    }
  });

  if (!delivery) notFound();

  const isAssignedToMe = delivery.driverId === session.user.id;
  const isAvailable = delivery.status === "PENDING" && !delivery.driverId;
  const canView = isAssignedToMe || isAvailable || session.user.role === "ADMIN";

  if (!canView) notFound();

  const order = delivery.order;
  const gain = order?.deliveryFee ? Math.round(order.deliveryFee * 0.9) : 0;

  const noteParts = order?.note?.split(" · ") ?? [];
  const phoneFromNote = noteParts.find((p) => p.startsWith("Téléphone:"))?.replace("Téléphone: ", "") ?? order?.customer?.phone ?? "";
  const placeIdFromNote = noteParts.find((p) => p.startsWith("placeId:"))?.replace("placeId: ", "");
  const instructionsFromNote = noteParts.filter((p) => !p.startsWith("Téléphone:") && !p.startsWith("Code promo") && !p.startsWith("savedAddressId:") && !p.startsWith("placeId:")).join(" · ");

  return (
    <DriverShell title={`Livraison ${order?.orderNumber?.slice(-6) ?? delivery.id.slice(-6)}`} sections={driverNavSections}>
      <div className="grid gap-5">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-black text-dalle-orange">Commande</p>
              <h1 className="text-2xl font-black text-dalle-charcoal">{order?.orderNumber}</h1>
            </div>
            <Badge variant={delivery.status === "DELIVERED" ? "lime" : delivery.status === "FAILED" ? "neutral" : "orange"}>{delivery.status}</Badge>
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between"><span>Restaurant</span><span className="max-w-48 text-right font-bold">{order?.restaurant?.name}</span></div>
            <div className="flex justify-between"><span>Adresse restaurant</span><span className="max-w-48 text-right font-bold">{order?.restaurant?.address}</span></div>
            <div className="flex justify-between"><span>Client</span><span className="font-bold">{order?.customer?.name ?? "Client"}</span></div>
            <div className="flex justify-between"><span>Adresse client</span><span className="max-w-48 text-right font-bold">{order?.address ? `${order.address.street}, ${order.address.city}` : "—"}</span></div>
            {phoneFromNote ? <div className="flex justify-between"><span>Téléphone client</span><span className="font-bold">{phoneFromNote}</span></div> : null}
            <div className="flex justify-between"><span>Total</span><span className="font-black text-dalle-orange">{formatPrice(order?.total ?? 0)}</span></div>
            <div className="flex justify-between"><span>Frais livraison</span><span className="font-bold">{formatPrice(order?.deliveryFee ?? 0)}</span></div>
            <div className="flex justify-between"><span>Votre gain (90%)</span><span className="font-black text-dalle-lime">{formatPrice(gain)}</span></div>
          </div>
        </Card>

        {instructionsFromNote ? (
          <Card className="p-5">
            <h2 className="font-black">Instructions client</h2>
            <p className="mt-2 text-sm text-neutral-600">{instructionsFromNote}</p>
          </Card>
        ) : null}

        {placeIdFromNote ? (
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-dalle-orange" />
              <h2 className="font-black">Repère proche</h2>
            </div>
            <p className="mt-2 text-sm font-bold text-dalle-charcoal">{placeIdFromNote}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="inline-flex items-center rounded-2xl border border-black/5 bg-white px-3 py-2 text-xs font-bold text-neutral-600" href={`/api/places/nearby?lat=6.36&lng=2.42&radius=500`} target="_blank">Lieux proches</a>
            </div>
          </Card>
        ) : null}

        {isAssignedToMe ? (
          <Card className="p-5">
            <h2 className="font-black">Signaler un problème</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <AlertTriangle size={14} className="mr-1" />
                Lieu introuvable
              </Button>
              <Button variant="outline" size="sm">
                <Lightbulb size={14} className="mr-1" />
                Proposer un repère
              </Button>
            </div>
          </Card>
        ) : null}

        <Card className="p-5">
          <h2 className="font-black">Articles</h2>
          <div className="mt-3 grid gap-2">
            {order?.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}× {item.menuItem.name}</span>
                <span>{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-black">Actions</h2>
          <div className="mt-3">
            {isAvailable ? (
              <DeliveryActions deliveryId={delivery.id} status="PENDING" />
            ) : isAssignedToMe ? (
              <DeliveryActions deliveryId={delivery.id} status={delivery.status} />
            ) : (
              <p className="text-sm text-neutral-500">Cette livraison n&apos;est plus disponible.</p>
            )}
          </div>
        </Card>
      </div>
    </DriverShell>
  );
}
