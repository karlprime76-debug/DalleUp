"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/pricing/delivery";
import { DriverTrackingToggle } from "@/components/tracking/driver-tracking-toggle";

type DeliveryDetail = {
  id: string;
  orderNumber: string;
  status: string;
  deliveryStatus?: string;
  total: number;
  customer: string;
  address: string;
  phone?: string;
  note?: string | null;
  items: { name: string; quantity: number; total: number }[];
};

export function DriverDeliveryDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ops/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.order) {
          setDetail({
            id: json.order.id,
            orderNumber: json.order.orderNumber,
            status: json.order.status,
            deliveryStatus: json.order.delivery?.status,
            total: json.order.total,
            customer: json.order.customer?.name ?? "Client",
            address: json.order.address ? `${json.order.address.street}, ${json.order.address.city}` : "Adresse client",
            phone: json.order.note ? extractPhone(json.order.note) : undefined,
            note: json.order.note,
            items: json.order.items.map((item: { menuItem: { name: string }; quantity: number; total: number }) => ({
              name: item.menuItem.name,
              quantity: item.quantity,
              total: item.total,
            })),
          });
        }
      })
      .catch(() => setMessage("Données indisponibles."))
      .finally(() => setLoading(false));
  }, [orderId]);

  function extractPhone(note: string): string | undefined {
    const match = note.match(/Téléphone:\s*([^·]+)/);
    return match ? match[1].trim() : undefined;
  }

  async function updateStatus(status: string) {
    setStatusLoading(status);
    setMessage("");
    try {
      const res = await fetch(`/api/ops/deliveries/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setMessage(json?.message ?? "Statut non modifié.");
      } else {
        router.refresh();
        setDetail((prev) => (prev ? { ...prev, deliveryStatus: status } : prev));
      }
    } catch {
      setMessage("Réseau indisponible.");
    } finally {
      setStatusLoading(null);
    }
  }

  if (loading) return <Card className="p-5">Chargement…</Card>;
  if (!detail) return <Card className="p-5">Livraison introuvable.</Card>;

  const statuses = ["PICKED_UP", "ON_THE_WAY", "DELIVERED"];

  return (
    <div className="grid gap-5">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-black text-dalle-orange">Livraison</p>
            <h1 className="text-2xl font-black text-dalle-charcoal">{detail.orderNumber}</h1>
          </div>
          <OrderStatusBadge status={detail.status} />
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between"><span>Client</span><span className="font-bold">{detail.customer}</span></div>
          <div className="flex justify-between"><span>Adresse</span><span className="max-w-48 text-right font-bold">{detail.address}</span></div>
          {detail.phone ? <div className="flex justify-between"><span>Téléphone</span><span className="font-bold">{detail.phone}</span></div> : null}
          <div className="flex justify-between"><span>Total</span><span className="font-black text-dalle-orange">{formatPrice(detail.total)}</span></div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-black">Articles</h2>
        <div className="mt-3 grid gap-2">
          {detail.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.quantity}× {item.name}</span>
              <span>{formatPrice(item.total)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-black">Statut livraison</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={detail.deliveryStatus === s ? "secondary" : "dark"}
              disabled={statusLoading !== null}
              onClick={() => updateStatus(s)}
            >
              {statusLoading === s ? "…" : s === "PICKED_UP" ? "Récupérée" : s === "ON_THE_WAY" ? "En route" : "Livrée"}
            </Button>
          ))}
        </div>
        {detail.deliveryStatus ? <Badge variant="neutral" className="mt-2">{detail.deliveryStatus}</Badge> : null}
        {message ? <p className="mt-2 text-xs font-bold text-dalle-orange">{message}</p> : null}
      </Card>

      <Card className="p-5">
        <h2 className="font-black">Suivi GPS</h2>
        <div className="mt-3">
          <DriverTrackingToggle orderId={orderId} />
        </div>
      </Card>
    </div>
  );
}
