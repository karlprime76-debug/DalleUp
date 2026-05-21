"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Card } from "@/components/ui/card";
import { orders } from "@/lib/mock-data";
import { getLocalOrders, type LocalOrder } from "@/lib/orders/local-orders";
import { formatPrice } from "@/lib/pricing/delivery";

type RemoteOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  restaurant?: { name: string };
};

export function OrdersPageClient() {
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>([]);
  const [remoteOrders, setRemoteOrders] = useState<RemoteOrder[]>([]);
  useEffect(() => {
    setLocalOrders(getLocalOrders());
    fetch("/api/orders").then((response) => response.ok ? response.json() : { orders: [] }).then((payload) => setRemoteOrders(payload.orders ?? [])).catch(() => setRemoteOrders([]));
  }, []);
  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <p className="font-black text-dalle-orange">Historique</p><h1 className="text-3xl font-black text-dalle-charcoal">Mes commandes</h1>
        <div className="mt-6 grid gap-3">
          {remoteOrders.map((order) => <Link key={order.id} href={`/app/orders/${order.id}`}><Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex justify-between gap-3"><b>{order.orderNumber}</b><OrderStatusBadge status={order.status} /></div><p className="mt-1 text-neutral-500">{order.restaurant?.name ?? "Restaurant DalleUp"} · {new Date(order.createdAt).toLocaleString("fr-FR")}</p><p className="mt-2 font-black text-dalle-orange">{formatPrice(order.total)}</p></Card></Link>)}
          {localOrders.map((order) => <Link key={order.id} href={`/app/orders/${order.id}`}><Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex justify-between gap-3"><b>{order.reference}</b><OrderStatusBadge status={order.orderStatus} /></div><p className="mt-1 text-neutral-500">{order.restaurantName} · {new Date(order.createdAt).toLocaleString("fr-FR")}</p><p className="mt-2 font-black text-dalle-orange">{formatPrice(order.total)}</p></Card></Link>)}
          {remoteOrders.length === 0 && localOrders.length === 0 ? <div className="rounded-3xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">Mode démo : ces commandes sont fictives et servent uniquement à présenter l’expérience DalleUp.</div> : null}
          {remoteOrders.length === 0 && localOrders.length === 0 ? orders.map((order) => <Link key={order.id} href={`/app/orders/${order.id}`}><Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex justify-between gap-3"><b>{order.id}</b><OrderStatusBadge status={order.status} /></div><p className="mt-1 text-neutral-500">{order.restaurant} · {order.createdAt}</p><p className="mt-2 font-black text-dalle-orange">{formatPrice(order.total)}</p></Card></Link>) : null}
        </div>
      </div>
    </main>
  );
}
