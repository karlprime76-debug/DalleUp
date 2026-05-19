"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, CookingPot, PackageCheck, Truck } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { orders } from "@/lib/mock-data";
import { getLocalOrderById, type LocalOrder } from "@/lib/orders/local-orders";
import { formatPrice } from "@/lib/pricing/delivery";

const timeline = [
  { key: "PENDING", label: "Commande reçue", icon: Clock },
  { key: "PREPARING", label: "En préparation", icon: CookingPot },
  { key: "READY", label: "Prête", icon: PackageCheck },
  { key: "ON_THE_WAY", label: "En livraison", icon: Truck },
  { key: "DELIVERED", label: "Livrée", icon: CheckCircle2 }
];

type RemoteOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  restaurant?: { name: string };
  address?: { street: string; city: string; zone?: string | null } | null;
  items?: { id: string; quantity: number; unitPrice: number; total: number; menuItem: { name: string } }[];
  payment?: { method: string } | null;
};

export function OrderDetailsClient({ id }: { id: string }) {
  const [localOrder, setLocalOrder] = useState<LocalOrder | undefined>();
  const [remoteOrder, setRemoteOrder] = useState<RemoteOrder | undefined>();
  useEffect(() => {
    setLocalOrder(getLocalOrderById(id));
    fetch(`/api/orders/${id}`).then((response) => response.ok ? response.json() : { order: undefined }).then((payload) => setRemoteOrder(payload.order)).catch(() => setRemoteOrder(undefined));
  }, [id]);
  const mockOrder = orders.find((item) => item.id === id);
  const status = remoteOrder?.status ?? localOrder?.orderStatus ?? mockOrder?.status ?? "PENDING";
  const activeIndex = Math.max(0, timeline.findIndex((step) => step.key === status));
  const title = remoteOrder?.orderNumber ?? localOrder?.reference ?? mockOrder?.id ?? id;
  const restaurantName = remoteOrder?.restaurant?.name ?? localOrder?.restaurantName ?? mockOrder?.restaurant ?? "Commande DalleUp";
  const address = remoteOrder?.address ? `${remoteOrder.address.street}, ${remoteOrder.address.city}` : localOrder?.address ?? mockOrder?.address ?? "Adresse client";
  const total = remoteOrder?.total ?? localOrder?.total ?? mockOrder?.total ?? 0;

  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4"><div><p className="font-black text-dalle-orange">Suivi commande</p><h1 className="text-3xl font-black text-dalle-charcoal">{title}</h1><p className="mt-2 text-neutral-500">{restaurantName}</p></div><OrderStatusBadge status={status} /></div>
        <Card className="mt-6 p-5"><div className="grid gap-5">{timeline.map((step, index) => { const Icon = step.icon; const done = index <= activeIndex; return <div key={step.key} className="flex items-center gap-4"><div className={done ? "grid h-12 w-12 place-items-center rounded-2xl bg-dalle-orange text-white" : "grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-400"}>{done ? <Icon size={22} /> : <Circle size={22} />}</div><div className="flex-1"><p className="font-black">{step.label}</p><div className="mt-2 h-2 rounded-full bg-neutral-100"><div className={done ? "h-2 rounded-full bg-dalle-orange" : "h-2 w-0 rounded-full bg-dalle-orange"} /></div></div>{done ? <Badge variant="lime">OK</Badge> : <Badge variant="neutral">À venir</Badge>}</div>; })}</div></Card>
        <Card className="mt-5 p-5"><h2 className="text-xl font-black">Articles</h2>{remoteOrder?.items?.length ? <div className="mt-3 grid gap-2">{remoteOrder.items.map((item) => <div key={item.id} className="flex justify-between text-sm"><span>{item.quantity}× {item.menuItem.name}</span><span>{formatPrice(item.total)}</span></div>)}</div> : localOrder ? <div className="mt-3 grid gap-2">{localOrder.items.map((item) => <div key={item.id} className="flex justify-between text-sm"><span>{item.quantity}× {item.name}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}</div> : <p className="mt-3 text-sm text-neutral-500">Détails articles mock non disponibles.</p>}</Card>
        <Card className="mt-5 p-5"><h2 className="text-xl font-black">Résumé</h2><div className="mt-4 grid gap-2 text-sm"><div className="flex justify-between"><span>Adresse</span><span className="font-bold">{address}</span></div><div className="flex justify-between"><span>Paiement</span><span className="font-bold">Cash à la livraison</span></div><div className="flex justify-between text-lg font-black"><span>Total</span><span className="text-dalle-orange">{formatPrice(total)}</span></div></div></Card>
      </div>
    </main>
  );
}
