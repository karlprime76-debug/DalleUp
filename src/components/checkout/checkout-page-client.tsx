"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, MapPin, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "@/lib/cart/cart-store";
import { formatPrice } from "@/lib/pricing/delivery";

const addresses = ["Maison · Cadjèhoun, Cotonou", "Bureau · Haie Vive, Cotonou", "Campus · Calavi centre"];

type CreatedOrderResponse = { order?: { id: string; orderNumber: string } };

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (items.length === 0) return <main className="px-4 py-6"><div className="mx-auto max-w-3xl"><EmptyState title="Aucun article à payer" description="Ton panier est vide. Ajoute un plat avant de passer au checkout." actionHref="/app/restaurants" actionLabel="Voir les restaurants" /></div></main>;

  async function confirmOrder() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, subtotal, deliveryFee, total, paymentMethod: "CASH_ON_DELIVERY", address: addresses[0] }) });
      if (response.ok) {
        const payload = await response.json() as CreatedOrderResponse;
        clearCart();
        router.push(`/app/orders/${payload.order?.id ?? payload.order?.orderNumber}`);
        return;
      }
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      const payload = await response.json().catch(() => null);
      setMessage(payload?.message ?? "Commande impossible pour le moment.");
    } catch {
      setMessage("Commande impossible : vérifie ta connexion puis réessaie.");
    }
    setLoading(false);
  }

  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <p className="font-black text-dalle-orange">Checkout</p><h1 className="text-3xl font-black text-dalle-charcoal">Dernière étape</h1>
        {message ? <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">{message}</div> : null}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-5">
            <Card className="p-5"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-dalle-orange"><MapPin size={22} /></div><div className="w-full"><h2 className="font-black">Adresse de livraison</h2><div className="mt-3 grid gap-2">{addresses.map((address, index) => <label key={address} className="flex items-center justify-between rounded-2xl bg-neutral-50 p-3 text-sm font-bold"><span>{address}</span><input name="address" type="radio" defaultChecked={index === 0} /></label>)}</div></div></div></Card>
            <Card className="p-5"><h2 className="font-black">Moyen de paiement</h2><div className="mt-4 grid gap-3"><label className="flex items-center justify-between rounded-3xl border-2 border-dalle-orange bg-orange-50 p-4"><span className="flex items-center gap-3 font-black"><Banknote size={20} /> Paiement à la livraison</span><input type="radio" defaultChecked /></label><label className="flex items-center justify-between rounded-3xl bg-neutral-50 p-4 text-neutral-400"><span className="flex items-center gap-3 font-black"><Smartphone size={20} /> MTN MoMo</span><Badge variant="neutral">Bientôt</Badge></label><label className="flex items-center justify-between rounded-3xl bg-neutral-50 p-4 text-neutral-400"><span className="flex items-center gap-3 font-black"><Smartphone size={20} /> Moov Money</span><Badge variant="neutral">Mock</Badge></label></div></Card>
          </div>
          <Card className="h-fit p-5"><h2 className="text-xl font-black">Résumé commande</h2><div className="mt-4 grid gap-3 text-sm">{items.map((item) => <div key={item.id} className="flex justify-between"><span>{item.quantity}× {item.name}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}<div className="flex justify-between border-t pt-3"><span>Livraison</span><span>{formatPrice(deliveryFee)}</span></div><div className="flex justify-between text-xl font-black"><span>Total</span><span>{formatPrice(total)}</span></div></div><Button className="mt-5 w-full" type="button" onClick={confirmOrder} disabled={loading}>{loading ? "Validation..." : "Confirmer la commande"}</Button></Card>
        </div>
      </div>
    </main>
  );
}
