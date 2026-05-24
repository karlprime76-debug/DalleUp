"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/pricing/delivery";

type RemoteOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  restaurant?: { name: string };
  delivery?: {
    status: string;
    driver?: { name: string } | null;
  } | null;
};

function clientDeliveryLabel(order: RemoteOrder) {
  const ds = order.delivery?.status;
  if (!ds) return "Recherche d'un livreur";
  if (ds === "PENDING") return "Recherche d'un livreur";
  if (ds === "ASSIGNED") return `Livreur assigné : ${order.delivery?.driver?.name ?? ""}`;
  if (ds === "PICKED_UP") return "Commande récupérée par le livreur";
  if (ds === "ON_THE_WAY") return "Votre livreur est en route";
  if (ds === "DELIVERED") return "Commande livrée";
  if (ds === "FAILED") return "Livraison annulée";
  return ds;
}

export function OrdersPageClient() {
  const [remoteOrders, setRemoteOrders] = useState<RemoteOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/orders").then((response) => response.ok ? response.json() : { orders: [] }).then((payload) => setRemoteOrders(payload.orders ?? [])).catch(() => setRemoteOrders([])).finally(() => setLoaded(true));
  }, []);
  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <p className="font-black text-dalle-orange">Historique</p><h1 className="text-3xl font-black text-dalle-charcoal">Mes commandes</h1>
        <div className="mt-6 grid gap-3">
          {remoteOrders.map((order) => (
            <Link key={order.id} href={`/app/orders/${order.id}`}>
              <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex justify-between gap-3"><b>{order.orderNumber}</b><OrderStatusBadge status={order.status} /></div>
                <p className="mt-1 text-neutral-500">{order.restaurant?.name ?? "Restaurant DalleUp"} · {new Date(order.createdAt).toLocaleString("fr-FR")}</p>
                <p className="mt-1 text-xs font-bold text-dalle-orange">{clientDeliveryLabel(order)}</p>
                <p className="mt-2 font-black text-dalle-orange">{formatPrice(order.total)}</p>
              </Card>
            </Link>
          ))}
          {loaded && remoteOrders.length === 0 ? <EmptyState title="Aucune commande pour le moment" description="Passez votre première commande pour retrouver son suivi ici." actionHref="/app/restaurants" actionLabel="Voir les restaurants" /> : null}
        </div>
      </div>
    </main>
  );
}
