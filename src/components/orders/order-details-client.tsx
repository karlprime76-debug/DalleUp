"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, CookingPot, PackageCheck, Truck, CreditCard, Navigation } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderTrackingMap } from "@/components/tracking/order-tracking-map";
import { useDeliveryRealtimeLocation } from "@/hooks/use-delivery-realtime-location";
import { formatPrice } from "@/lib/pricing/delivery";

const timeline = [
  { key: "PENDING", label: "Commande reçue", icon: Clock },
  { key: "ACCEPTED", label: "Acceptée", icon: CheckCircle2 },
  { key: "PREPARING", label: "En préparation", icon: CookingPot },
  { key: "READY", label: "Prête", icon: PackageCheck },
  { key: "PICKED_UP", label: "Récupérée", icon: Truck },
  { key: "DELIVERED", label: "Livrée", icon: CheckCircle2 }
];

type RemoteOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  note?: string | null;
  createdAt: string;
  restaurant?: { name: string; latitude?: number | null; longitude?: number | null };
  address?: { street: string; city: string; zone?: string | null; latitude?: number | null; longitude?: number | null } | null;
  delivery?: { id: string; status: string; driver?: { name: string } | null } | null;
  items?: { id: string; quantity: number; unitPrice: number; total: number; menuItem: { name: string } }[];
  payment?: { method: string; status: string } | null;
};

export function OrderDetailsClient({ id }: { id: string }) {
  const [remoteOrder, setRemoteOrder] = useState<RemoteOrder | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const deliveryId = remoteOrder?.delivery?.id;
  const { driverLocation, status: realtimeStatus } = useDeliveryRealtimeLocation(deliveryId);

  useEffect(() => {
    fetch(`/api/orders/${id}`).then((response) => response.ok ? response.json() : { order: undefined }).then((payload) => setRemoteOrder(payload.order)).catch(() => setRemoteOrder(undefined)).finally(() => setLoaded(true));
  }, [id]);

  async function payNow() {
    if (!remoteOrder || payLoading) return;
    setPayLoading(true);
    setPayError("");
    try {
      const res = await fetch("/api/payments/paydunya/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: remoteOrder.id }),
      });
      const json = await res.json();
      if (res.ok && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else {
        setPayError(json.message || "Impossible d’initier le paiement.");
      }
    } catch {
      setPayError("Erreur réseau. Réessayez plus tard.");
    } finally {
      setPayLoading(false);
    }
  }

  if (loaded && !remoteOrder) return <main className="px-4 py-6"><div className="mx-auto max-w-3xl"><EmptyState title="Commande introuvable" description="Cette commande n’existe pas ou n’est pas accessible avec votre compte." actionHref="/app/orders" actionLabel="Retour aux commandes" /></div></main>;
  if (!remoteOrder) return <main className="px-4 py-6"><div className="mx-auto max-w-3xl"><Card className="p-5 font-bold text-neutral-500">Chargement de la commande...</Card></div></main>;

  const activeIndex = Math.max(0, timeline.findIndex((step) => step.key === remoteOrder.status));
  const address = remoteOrder.address ? `${remoteOrder.address.street}, ${remoteOrder.address.city}` : "Adresse client";
  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4"><div><p className="font-black text-dalle-orange">Suivi commande</p><h1 className="text-3xl font-black text-dalle-charcoal">{remoteOrder.orderNumber}</h1><p className="mt-2 text-neutral-500">{remoteOrder.restaurant?.name ?? "Restaurant DalleUp"}</p></div><OrderStatusBadge status={remoteOrder.status} /></div>
        <Card className="mt-6 p-5"><div className="grid gap-5">{timeline.map((step, index) => { const Icon = step.icon; const done = activeIndex >= 0 && index <= activeIndex; return <div key={step.key} className="flex items-center gap-4"><div className={done ? "grid h-12 w-12 place-items-center rounded-2xl bg-dalle-orange text-white" : "grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-400"}>{done ? <Icon size={22} /> : <Circle size={22} />}</div><div className="flex-1"><p className="font-black">{step.label}</p><div className="mt-2 h-2 rounded-full bg-neutral-100"><div className={done ? "h-2 rounded-full bg-dalle-orange" : "h-2 w-0 rounded-full bg-dalle-orange"} /></div></div>{done ? <Badge variant="lime">OK</Badge> : <Badge variant="neutral">À venir</Badge>}</div>; })}</div></Card>
        <Card className="mt-5 p-5"><h2 className="text-xl font-black">Articles</h2>{remoteOrder.items?.length ? <div className="mt-3 grid gap-2">{remoteOrder.items.map((item) => <div key={item.id} className="flex justify-between text-sm"><span>{item.quantity}× {item.menuItem.name}</span><span>{formatPrice(item.total)}</span></div>)}</div> : <p className="mt-3 text-sm text-neutral-500">Aucun article trouvé pour cette commande.</p>}</Card>
        <Card className="mt-5 p-5"><h2 className="text-xl font-black">Résumé</h2><div className="mt-4 grid gap-2 text-sm"><div className="flex justify-between"><span>Adresse</span><span className="font-bold">{address}</span></div><div className="flex justify-between"><span>Instructions</span><span className="max-w-44 text-right font-bold">{remoteOrder.note ?? "—"}</span></div><div className="flex justify-between"><span>Paiement</span><span className="font-bold">{remoteOrder.payment?.status === "PAID" ? "Payé" : remoteOrder.payment?.status === "FAILED" ? "Échoué" : "En attente"}</span></div><div className="flex justify-between"><span>Sous-total</span><span>{formatPrice(remoteOrder.subtotal)}</span></div><div className="flex justify-between"><span>Livraison</span><span>{formatPrice(remoteOrder.deliveryFee)}</span></div><div className="flex justify-between text-lg font-black"><span>Total</span><span className="text-dalle-orange">{formatPrice(remoteOrder.total)}</span></div></div></Card>

        {/* Carte de suivi */}
        {(remoteOrder.address?.latitude || remoteOrder.restaurant?.latitude || driverLocation) && (
          <Card className="mt-5 p-5">
            <h2 className="text-xl font-black">Suivi sur la carte</h2>
            <div className="mt-3">
              <OrderTrackingMap
                restaurantLocation={remoteOrder.restaurant?.latitude && remoteOrder.restaurant?.longitude ? { lat: remoteOrder.restaurant.latitude, lng: remoteOrder.restaurant.longitude, label: remoteOrder.restaurant.name } : undefined}
                customerLocation={remoteOrder.address?.latitude && remoteOrder.address?.longitude ? { lat: remoteOrder.address.latitude, lng: remoteOrder.address.longitude, label: address } : undefined}
                driverLocation={driverLocation ? { lat: driverLocation.latitude, lng: driverLocation.longitude, label: remoteOrder.delivery?.driver?.name ?? "Livreur" } : undefined}
                height="280px"
              />
            </div>
            {driverLocation ? (
              <p className="mt-2 flex items-center gap-1 text-xs font-bold text-green-700">
                <Navigation size={14} className="animate-pulse" />
                Position mise à jour {realtimeStatus === "SUBSCRIBED" ? "en temps réel" : "automatiquement"}
              </p>
            ) : realtimeStatus === "CONNECTING" ? (
              <p className="mt-2 text-xs text-neutral-500">Connexion au suivi…</p>
            ) : remoteOrder.delivery?.driver ? (
              <p className="mt-2 text-xs text-neutral-500">Le suivi démarre dès que le livreur récupère la commande.</p>
            ) : null}
          </Card>
        )}

        {remoteOrder.payment?.status === "PENDING" && remoteOrder.status !== "CANCELLED" && (
          <Card className="mt-5 p-5 text-center">
            <p className="text-sm text-neutral-500">Paiement à la réception via Mobile Money</p>
            <Button onClick={payNow} disabled={payLoading} className="mt-3 w-full">
              <CreditCard size={18} />
              {payLoading ? "Redirection…" : "Payer maintenant"}
            </Button>
            {payError && <p className="mt-2 text-sm text-red-600">{payError}</p>}
          </Card>
        )}
      </div>
    </main>
  );
}
