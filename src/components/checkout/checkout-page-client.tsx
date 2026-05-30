"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, Smartphone, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/geo/address-autocomplete";
import { useCart } from "@/lib/cart/cart-store";
import { formatPrice } from "@/lib/pricing/delivery";
import { getDeliveryFeeEstimate } from "@/lib/billing/delivery-fee";

type SettingsPublic = {
  platformServiceFee?: number;
  allowCashPayment?: boolean;
  allowMockPayment?: boolean;
  nodeEnv?: string;
};

type CheckoutMethod = "PAYDUNYA" | "CASH_ON_DELIVERY" | "MOCK";

type PromoResult = {
  valid: boolean;
  discountAmount: number;
  discountType: string;
  code: string;
  message?: string;
};

type SavedAddressItem = {
  id: string;
  label: string;
  addressText: string;
  commune?: string;
  neighborhood?: string;
  landmarkText?: string;
  instructions?: string;
  phone?: string;
  placeId?: string;
};

type NearbyPlace = {
  id: string;
  name: string;
  type: string;
  distance: number;
};

type CreatePaymentResponse = {
  ok: boolean;
  order?: { id: string; orderNumber: string };
  checkoutUrl?: string;
  token?: string;
  message?: string;
  error?: string;
};

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZone, setDeliveryZone] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutMethod>("PAYDUNYA");
  const [selectedPlaceLabel, setSelectedPlaceLabel] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [settings, setSettings] = useState<SettingsPublic>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [landmarkQuery, setLandmarkQuery] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json().catch(() => ({})))
      .then((data) => setSettings(data))
      .catch(() => setSettings({}));
    fetch("/api/user/saved-addresses")
      .then((r) => r.json().catch(() => ({ addresses: [] })))
      .then((data) => setSavedAddresses(data.addresses ?? []))
      .catch(() => setSavedAddresses([]));
  }, []);

  const serviceFee = settings.platformServiceFee ?? 0;
  const computedDeliveryFee = useMemo(() => getDeliveryFeeEstimate({ zone: deliveryZone }), [deliveryZone]);
  const promoDiscount = promoResult?.discountAmount ?? 0;
  const computedSubtotalAfterPromo = Math.max(0, subtotal - promoDiscount);
  const computedTotal = useMemo(() => computedSubtotalAfterPromo + (computedDeliveryFee ?? 0) + serviceFee, [computedSubtotalAfterPromo, computedDeliveryFee, serviceFee]);
  const hasAlcohol = items.some((item) => item.isAlcohol);

  const addressFromSaved = savedAddresses.find((a) => a.id === selectedSavedAddressId);
  const effectiveZone = addressFromSaved?.commune ?? deliveryZone;
  const effectiveAddress = addressFromSaved?.addressText ?? deliveryAddress;
  const effectivePhone = addressFromSaved?.phone ?? deliveryPhone;
  const effectiveInstructions = addressFromSaved?.instructions ?? deliveryInstructions;
  const effectivePlaceId = selectedPlaceId ?? addressFromSaved?.placeId ?? null;

  const phoneOk = (effectivePhone ?? "").trim().length >= 6;
  const zoneOk = effectiveZone.trim().length > 0;
  const deliveryFeeOk = computedDeliveryFee !== null;
  const ageOk = !hasAlcohol || ageConfirmed;
  const canOrder = zoneOk && phoneOk && deliveryFeeOk && ageOk;

  const validationMessage = !zoneOk
    ? "Sélectionnez un lieu de livraison dans la liste."
    : !deliveryFeeOk
      ? "Frais de livraison non disponibles pour ce lieu."
      : !phoneOk
        ? "Ajoutez un numéro de téléphone pour continuer."
        : !ageOk
          ? "Confirmez avoir l’âge légal requis."
          : null;

  if (items.length === 0) return <main className="px-4 py-6"><div className="mx-auto max-w-3xl"><EmptyState title="Aucun article à payer" description="Votre panier est vide. Ajoutez un plat avant de passer au paiement." actionHref="/app/restaurants" actionLabel="Voir les restaurants" /></div></main>;

  async function validatePromo() {
    const code = promoCode.trim();
    if (!code || !items[0]?.restaurantId) {
      setPromoResult(null);
      return;
    }
    setPromoValidating(true);
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: items[0].restaurantId,
          code,
          subtotalAmount: subtotal,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.valid) {
        setPromoResult({ valid: false, discountAmount: 0, discountType: "", code, message: data?.message ?? "Code promo invalide." });
        return;
      }
      setPromoResult({ valid: true, discountAmount: data.discountAmount ?? 0, discountType: data.promo?.discountType ?? "", code: data.promo?.code ?? code });
    } catch {
      setPromoResult(null);
    } finally {
      setPromoValidating(false);
    }
  }

  async function confirmOrder() {
    if (!canOrder) {
      setMessage(validationMessage ?? "Veuillez compléter les informations requises.");
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
      const body = {
        items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        restaurantId: items[0]?.restaurantId,
        paymentMethod,
        deliveryAddress: effectiveAddress.trim() || effectiveZone,
        deliveryZone: effectiveZone,
        deliveryPhone: effectivePhone,
        deliveryInstructions: effectiveInstructions,
        savedAddressId: selectedSavedAddressId,
        placeId: effectivePlaceId,
        promoCode,
      };
      const orderResponse = await fetch("/api/orders/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!orderResponse.ok) {
        if (orderResponse.status === 401) {
          router.push("/login?callbackUrl=/app/checkout");
          return;
        }
        const payload = (await orderResponse.json().catch(() => ({}))) as CreatePaymentResponse;
        const errorText = payload.error ?? payload.message ?? "Commande impossible pour le moment.";
        console.error("[DalleUp checkout] API error:", errorText, payload);
        setMessage(errorText);
        setLoading(false);
        return;
      }
      const payload = (await orderResponse.json()) as CreatePaymentResponse;
      const orderId = payload.order?.id;
      if (!orderId) {
        setMessage("Commande créée mais identifiant introuvable.");
        setLoading(false);
        return;
      }
      if (payload.checkoutUrl) {
        clearCart();
        console.log("[DalleUp checkout] redirecting to", payload.checkoutUrl);
        window.location.href = payload.checkoutUrl;
        return;
      }
      // Fallback cash on delivery or mock without checkoutUrl
      clearCart();
      router.push(`/app/orders/${orderId}`);
    } catch (err) {
      console.error("[DalleUp checkout] network/error:", err);
      setMessage("Commande impossible : vérifiez votre connexion puis réessayez.");
      setLoading(false);
    }
  }

  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <p className="font-black text-dalle-orange">Paiement</p>
        <h1 className="text-3xl font-black text-dalle-charcoal">Commander et payer</h1>
        {message ? <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-dalle-orange">{message}</div> : null}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-5">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-dalle-orange"><MapPin size={22} /></div>
                <div className="w-full">
                  <h2 className="font-black">Adresse de livraison</h2>
                  <div className="mt-3 grid gap-3">
                    {savedAddresses.length > 0 ? (
                      <div className="grid gap-2">
                        <p className="text-sm font-bold text-neutral-600">Adresses enregistrées</p>
                        <div className="flex flex-wrap gap-2">
                          {savedAddresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                setSelectedSavedAddressId(addr.id === selectedSavedAddressId ? null : addr.id);
                                if (addr.commune) setDeliveryZone(addr.commune);
                              }}
                              className={addr.id === selectedSavedAddressId ? "rounded-2xl border-2 border-dalle-orange bg-orange-50 px-3 py-2 text-xs font-bold text-dalle-orange" : "rounded-2xl border border-black/5 bg-white px-3 py-2 text-xs font-bold text-neutral-600"}
                            >
                              {addr.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <AddressAutocomplete
                      onSelect={(place) => {
                        setSelectedPlaceLabel(place.label);
                        setDeliveryZone(place.name);
                        setSelectedSavedAddressId(null);
                      }}
                      placeholder="Quartier, ville ou lieu proche…"
                    />
                    {selectedPlaceLabel ? (
                      <p className="text-xs text-neutral-500">Lieu sélectionné : <span className="font-bold text-dalle-orange">{selectedPlaceLabel}</span></p>
                    ) : null}
                    <Input value={deliveryAddress} onChange={(event) => { setDeliveryAddress(event.target.value); setSelectedSavedAddressId(null); }} placeholder="Complément d’adresse : maison blanche, portail noir, étage…" />
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <Input value={landmarkQuery} onChange={(event) => setLandmarkQuery(event.target.value)} placeholder="Repère proche : pharmacie, carrefour, marché…" />
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          if (!landmarkQuery.trim()) return;
                          fetch(`/api/places/search?q=${encodeURIComponent(landmarkQuery)}&commune=${encodeURIComponent(effectiveZone)}`)
                            .then((r) => r.json().catch(() => ({ places: [] })))
                            .then((data) => setNearbyPlaces(data.places ?? []))
                            .catch(() => setNearbyPlaces([]));
                        }}>
                          Chercher
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setGeoLoading(true);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              fetch(`/api/places/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=2000`)
                                .then((r) => r.json().catch(() => ({ places: [] })))
                                .then((data) => setNearbyPlaces(data.places ?? []))
                                .catch(() => setNearbyPlaces([]))
                                .finally(() => setGeoLoading(false));
                            },
                            () => { setGeoLoading(false); setMessage("Géolocalisation indisponible."); },
                            { timeout: 8000 }
                          );
                        }} disabled={geoLoading}>
                          <Navigation size={14} />
                        </Button>
                      </div>
                      {nearbyPlaces.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {nearbyPlaces.slice(0, 8).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { setSelectedPlaceId(p.id); setSelectedPlaceName(p.name); setLandmarkQuery(p.name); }}
                              className={p.id === selectedPlaceId ? "rounded-2xl border-2 border-dalle-orange bg-orange-50 px-2 py-1 text-xs font-bold text-dalle-orange" : "rounded-2xl border border-black/5 bg-white px-2 py-1 text-xs font-bold text-neutral-600"}
                            >
                              {p.name} {p.distance ? `(${p.distance}m)` : ""}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {selectedPlaceName ? <p className="text-xs font-bold text-dalle-orange">Repère : {selectedPlaceName}</p> : null}
                    </div>
                    <Input value={deliveryPhone} onChange={(event) => setDeliveryPhone(event.target.value)} placeholder="Téléphone de livraison" type="tel" />
                    <textarea value={deliveryInstructions} onChange={(event) => setDeliveryInstructions(event.target.value)} className="min-h-24 w-full rounded-3xl border border-black/5 bg-white px-5 py-4 text-sm font-semibold outline-none shadow-sm transition placeholder:text-neutral-400 focus:border-dalle-orange focus:ring-4 focus:ring-dalle-orange/10" placeholder="Instructions optionnelles : étage, portail, repère..." />
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-black">Moyen de paiement</h2>
              <p className="mt-2 text-sm text-neutral-500">Le paiement est requis pour confirmer votre commande. Après paiement confirmé, la commande sera envoyée au restaurant.</p>
              <div className="mt-4 grid gap-3">
                <label className={paymentMethod === "PAYDUNYA" ? "flex items-center justify-between rounded-3xl border-2 border-dalle-orange bg-orange-50 p-4" : "flex items-center justify-between rounded-3xl bg-neutral-50 p-4"}>
                  <span className="flex items-center gap-3 font-black"><CreditCard size={20} /> Payer avec PayDunya</span>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "PAYDUNYA"} onChange={() => setPaymentMethod("PAYDUNYA")} />
                </label>
                {settings.allowCashPayment ? (
                  <label className={paymentMethod === "CASH_ON_DELIVERY" ? "flex items-center justify-between rounded-3xl border-2 border-dalle-orange bg-orange-50 p-4" : "flex items-center justify-between rounded-3xl bg-neutral-50 p-4"}>
                    <span className="flex items-center gap-3 font-black"><CreditCard size={20} /> Paiement à la livraison</span>
                    <input type="radio" name="paymentMethod" checked={paymentMethod === "CASH_ON_DELIVERY"} onChange={() => setPaymentMethod("CASH_ON_DELIVERY")} />
                  </label>
                ) : null}
                {settings.allowMockPayment ? (
                  <label className={paymentMethod === "MOCK" ? "flex items-center justify-between rounded-3xl border-2 border-dalle-orange bg-orange-50 p-4" : "flex items-center justify-between rounded-3xl bg-neutral-50 p-4"}>
                    <span className="flex items-center gap-3 font-black"><Smartphone size={20} /> Paiement test (Mock)</span>
                    <input type="radio" name="paymentMethod" checked={paymentMethod === "MOCK"} onChange={() => setPaymentMethod("MOCK")} />
                  </label>
                ) : null}
                <label className="flex items-center justify-between rounded-3xl bg-neutral-50 p-4 text-neutral-400">
                  <span className="flex items-center gap-3 font-black"><Smartphone size={20} /> Mobile Money direct</span>
                  <Badge variant="neutral">Bientôt</Badge>
                </label>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-black">Code promo</h2>
              <p className="mt-2 text-sm text-neutral-500">La réduction est vérifiée et appliquée côté serveur.</p>
              <div className="mt-3 flex gap-2">
                <Input value={promoCode} onChange={(event) => { setPromoCode(event.target.value.toUpperCase()); setPromoResult(null); }} onBlur={validatePromo} placeholder="Ex: DALLEUP10" className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={validatePromo} disabled={promoValidating || !promoCode.trim()}>
                  {promoValidating ? "Vérification…" : "Vérifier"}
                </Button>
              </div>
              {promoResult?.valid ? (
                <p className="mt-2 text-xs font-bold text-lime-600">Code accepté : -{formatPrice(promoResult.discountAmount)}</p>
              ) : promoResult?.message ? (
                <p className="mt-2 text-xs font-bold text-red-600">{promoResult.message}</p>
              ) : null}
            </Card>
            {hasAlcohol ? (
              <Card className="p-5">
                <h2 className="font-black">Produit réservé aux adultes</h2>
                <p className="mt-2 text-sm text-neutral-600">Cette commande contient un produit réservé aux adultes. Une vérification peut être demandée à la livraison.</p>
                <label className="mt-4 flex items-start gap-3 rounded-3xl bg-orange-50 p-4 text-sm font-bold text-dalle-charcoal">
                  <input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} className="mt-1" />
                  Je confirme avoir l’âge légal requis.
                </label>
                <p className="mt-2 text-xs font-bold text-dalle-orange">Vérification à la livraison requise.</p>
              </Card>
            ) : null}
          </div>
          <Card className="h-fit p-5">
            <h2 className="text-xl font-black">Résumé commande</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3">
                  <span>{item.quantity}× {item.name}{item.category ? <span className="ml-1 text-neutral-400">· {item.category}</span> : null}{item.isAlcohol ? <span className="ml-1 font-black text-dalle-orange">18+</span> : null}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-3"><span>Total articles</span><span>{formatPrice(subtotal)}</span></div>
              {promoResult?.valid && promoResult.discountAmount > 0 ? (
                <div className="flex justify-between text-lime-600">
                  <span>Réduction ({promoResult.code})</span>
                  <span>-{formatPrice(promoResult.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Livraison</span>
                <span className={computedDeliveryFee === null ? "font-bold text-red-600" : ""}>
                  {computedDeliveryFee !== null ? formatPrice(computedDeliveryFee) : "À confirmer"}
                </span>
              </div>
              {serviceFee > 0 ? (
                <div className="flex justify-between"><span>Frais de service DalleUp</span><span>{formatPrice(serviceFee)}</span></div>
              ) : null}
              <div className="flex justify-between text-xl font-black">
                <span>Total à payer</span>
                <span>{computedDeliveryFee !== null ? formatPrice(computedTotal) : "—"}</span>
              </div>
              <p className="text-xs font-semibold text-neutral-500">Le serveur recalcule le total avant validation.</p>
            </div>
            <Button className="mt-5 w-full" type="button" onClick={confirmOrder} disabled={loading || !canOrder}>
              {loading ? "Vérification du paiement…" : "Payer maintenant"}
            </Button>
            {!canOrder && validationMessage ? (
              <p className="mt-3 text-center text-xs font-bold text-red-600">{validationMessage}</p>
            ) : null}
          </Card>
        </div>
      </div>
    </main>
  );
}
