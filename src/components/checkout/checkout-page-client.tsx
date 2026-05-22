"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, MapPin, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/geo/address-autocomplete";
import { useCart } from "@/lib/cart/cart-store";
import { formatPrice } from "@/lib/pricing/delivery";
import { getDeliveryFeeEstimate } from "@/lib/billing/delivery-fee";

type CreatedOrderResponse = { order?: { id: string; orderNumber: string } };
type CheckoutMethod = "CASH_ON_DELIVERY" | "PAYDUNYA";

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZone, setDeliveryZone] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutMethod>("CASH_ON_DELIVERY");
  const [selectedPlaceLabel, setSelectedPlaceLabel] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const computedDeliveryFee = useMemo(() => getDeliveryFeeEstimate({ zone: deliveryZone }), [deliveryZone]);
  const computedTotal = useMemo(() => subtotal + (computedDeliveryFee ?? 0), [subtotal, computedDeliveryFee]);
  const hasAlcohol = items.some((item) => item.isAlcohol);
  const canOrder = computedDeliveryFee !== null && deliveryAddress.trim().length >= 5 && deliveryPhone.trim().length >= 6 && deliveryZone.trim().length > 0 && (!hasAlcohol || ageConfirmed);

  if (items.length === 0) return <main className="px-4 py-6"><div className="mx-auto max-w-3xl"><EmptyState title="Aucun article à payer" description="Votre panier est vide. Ajoutez un plat avant de passer au paiement." actionHref="/app/restaurants" actionLabel="Voir les restaurants" /></div></main>;

  async function confirmOrder() {
    if (deliveryAddress.trim().length < 5) {
      setMessage("Indiquez une adresse de livraison complète.");
      return;
    }
    if (deliveryPhone.trim().length < 6) {
      setMessage("Indiquez un numéro de téléphone joignable.");
      return;
    }
    if (deliveryZone.trim().length === 0) {
      setMessage("Sélectionnez un lieu de livraison dans la liste.");
      return;
    }
    if (computedDeliveryFee === null) {
      setMessage("Frais de livraison non disponibles pour ce lieu.");
      return;
    }
    if (hasAlcohol && !ageConfirmed) {
      setMessage("Confirmez avoir l’âge légal requis avant de valider cette commande.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json().catch(() => null);
      if (!session?.user?.id) {
        router.push("/login?callbackUrl=/app/checkout");
        return;
      }
      const orderResponse = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, paymentMethod: paymentMethod === "PAYDUNYA" ? "CARD" : "CASH_ON_DELIVERY", deliveryAddress, deliveryZone, deliveryPhone, deliveryInstructions }) });
      if (!orderResponse.ok) {
        if (orderResponse.status === 401) {
          router.push("/login?callbackUrl=/app/checkout");
          return;
        }
        const payload = await orderResponse.json().catch(() => null);
        setMessage(payload?.message ?? "Commande impossible pour le moment.");
        setLoading(false);
        return;
      }
      const payload = await orderResponse.json() as CreatedOrderResponse;
      const orderId = payload.order?.id;
      if (!orderId) {
        setMessage("Commande créée mais identifiant introuvable.");
        setLoading(false);
        return;
      }
      if (paymentMethod === "PAYDUNYA") {
        const paymentResponse = await fetch("/api/payments/paydunya/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
        if (!paymentResponse.ok) {
          const paymentPayload = await paymentResponse.json().catch(() => null);
          setMessage(paymentPayload?.message ?? "Paiement PayDunya impossible pour le moment.");
          setLoading(false);
          return;
        }
        const paymentPayload = await paymentResponse.json() as { checkoutUrl?: string };
        if (!paymentPayload.checkoutUrl) {
          setMessage("Lien de paiement PayDunya introuvable.");
          setLoading(false);
          return;
        }
        clearCart();
        window.location.href = paymentPayload.checkoutUrl;
        return;
      }
      clearCart();
      router.push(`/app/orders/${orderId}`);
    } catch {
      setMessage("Commande impossible : vérifiez votre connexion puis réessayez.");
      setLoading(false);
    }
  }

  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <p className="font-black text-dalle-orange">Paiement</p><h1 className="text-3xl font-black text-dalle-charcoal">Valider ma commande</h1>
        {message ? <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">{message}</div> : null}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-5">
            <Card className="p-5"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-dalle-orange"><MapPin size={22} /></div><div className="w-full"><h2 className="font-black">Adresse de livraison</h2><div className="mt-3 grid gap-3">
              <AddressAutocomplete
                onSelect={(place) => {
                  setSelectedPlaceLabel(place.label);
                  setDeliveryZone(place.name);
                }}
                placeholder="Quartier, ville ou lieu proche…"
              />
              {selectedPlaceLabel ? (
                <p className="text-xs text-neutral-500">Lieu sélectionné : <span className="font-bold text-dalle-orange">{selectedPlaceLabel}</span></p>
              ) : null}
              <Input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Complément d’adresse : maison blanche, portail noir, étage…" />
              <Input value={deliveryPhone} onChange={(event) => setDeliveryPhone(event.target.value)} placeholder="Téléphone de livraison" type="tel" />
              <textarea value={deliveryInstructions} onChange={(event) => setDeliveryInstructions(event.target.value)} className="min-h-24 w-full rounded-3xl border border-black/5 bg-white px-5 py-4 text-sm font-semibold outline-none shadow-sm transition placeholder:text-neutral-400 focus:border-dalle-orange focus:ring-4 focus:ring-dalle-orange/10" placeholder="Instructions optionnelles : étage, portail, repère..." />
            </div></div></div></Card>
            <Card className="p-5"><h2 className="font-black">Moyen de paiement</h2><div className="mt-4 grid gap-3"><label className={paymentMethod === "CASH_ON_DELIVERY" ? "flex items-center justify-between rounded-3xl border-2 border-dalle-orange bg-orange-50 p-4" : "flex items-center justify-between rounded-3xl bg-neutral-50 p-4"}><span className="flex items-center gap-3 font-black"><Banknote size={20} /> Paiement à la réception via Mobile Money</span><input type="radio" name="paymentMethod" checked={paymentMethod === "CASH_ON_DELIVERY"} onChange={() => setPaymentMethod("CASH_ON_DELIVERY")} /></label><label className={paymentMethod === "PAYDUNYA" ? "flex items-center justify-between rounded-3xl border-2 border-dalle-orange bg-orange-50 p-4" : "flex items-center justify-between rounded-3xl bg-neutral-50 p-4"}><span className="flex items-center gap-3 font-black"><CreditCard size={20} /> Payer avec PayDunya</span><input type="radio" name="paymentMethod" checked={paymentMethod === "PAYDUNYA"} onChange={() => setPaymentMethod("PAYDUNYA")} /></label><label className="flex items-center justify-between rounded-3xl bg-neutral-50 p-4 text-neutral-400"><span className="flex items-center gap-3 font-black"><Smartphone size={20} /> Mobile Money direct</span><Badge variant="neutral">Bientôt</Badge></label></div></Card>
            {hasAlcohol ? <Card className="p-5"><h2 className="font-black">Produit réservé aux adultes</h2><p className="mt-2 text-sm text-neutral-600">Cette commande contient un produit réservé aux adultes. Une vérification peut être demandée à la livraison.</p><label className="mt-4 flex items-start gap-3 rounded-3xl bg-orange-50 p-4 text-sm font-bold text-dalle-charcoal"><input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} className="mt-1" />Je confirme avoir l’âge légal requis.</label><p className="mt-2 text-xs font-bold text-dalle-orange">Vérification à la livraison requise.</p></Card> : null}
          </div>
          <Card className="h-fit p-5">
            <h2 className="text-xl font-black">Résumé commande</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {items.map((item) => <div key={item.id} className="flex justify-between gap-3"><span>{item.quantity}× {item.name}{item.category ? <span className="ml-1 text-neutral-400">· {item.category}</span> : null}{item.isAlcohol ? <span className="ml-1 font-black text-dalle-orange">18+</span> : null}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}
              <div className="flex justify-between border-t pt-3"><span>Total articles</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span className={computedDeliveryFee === null ? "text-red-600 font-bold" : ""}>{computedDeliveryFee !== null ? formatPrice(computedDeliveryFee) : "À confirmer"}</span>
              </div>
              <div className="flex justify-between text-xl font-black"><span>Total à payer</span><span>{computedDeliveryFee !== null ? formatPrice(computedTotal) : "—"}</span></div>
              <p className="text-xs text-green-700 font-semibold">Le paiement se fait à la réception via Mobile Money sur DalleUp.</p>
              <p className="text-xs text-neutral-500">Le serveur recalcule le total avant validation.</p>
            </div>
            <Button className="mt-5 w-full" type="button" onClick={confirmOrder} disabled={loading || !canOrder}>
              {loading ? "Validation..." : paymentMethod === "PAYDUNYA" ? "Commander et payer" : "Valider ma commande"}
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
