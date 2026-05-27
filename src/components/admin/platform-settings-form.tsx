"use client";

import { useState, useEffect } from "react";
import {
  Globe, Truck, Percent, CreditCard, ShoppingBag, Store, Car, Megaphone, Bell, Wrench, Save, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type PlatformSettings = {
  id: string;
  platformName: string;
  platformSlogan: string;
  supportEmail: string;
  supportPhone: string;
  whatsappPhone: string;
  currency: string;
  country: string;
  city: string;
  defaultDeliveryFee: number;
  deliveryFeePerKm: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  maxDeliveryDistanceKm: number;
  estimatedPrepTimeMin: number;
  estimatedDeliveryTimeMin: number;
  restaurantCommissionRate: number;
  deliveryCommissionRate: number;
  platformServiceFee: number;
  restaurantPayoutDelayDays: number;
  driverPayoutDelayDays: number;
  allowCashPayment: boolean;
  allowMobileMoneyPayment: boolean;
  allowCardPayment: boolean;
  autoAcceptOrders: boolean;
  autoCancelUnpaidOrders: boolean;
  autoCancelDelayMinutes: number;
  allowClientOrderCancellation: boolean;
  allowRestaurantOrderCancellation: boolean;
  clientCancellationWindowMin: number;
  manualRestaurantApproval: boolean;
  allowRestaurantSelfProducts: boolean;
  allowRestaurantPriceEdit: boolean;
  autoHideClosedRestaurants: boolean;
  minRatingForFeature: number;
  manualDriverApproval: boolean;
  enableAutoDriverAssign: boolean;
  driverSearchRadiusKm: number;
  driverAcceptTimeoutSec: number;
  driverMinFee: number;
  driverDeliveryBonusEnabled: boolean;
  allowDriverRefusal: boolean;
  enableSponsoredRestaurants: boolean;
  sponsoredRestaurantDailyPrice: number;
  sponsoredRestaurantWeeklyPrice: number;
  sponsoredRestaurantMonthlyPrice: number;
  maxSponsoredRestaurants: number;
  sponsoredDefaultDurationDays: number;
  sponsoredDefaultStatus: string;
  enableTrendingDishes: boolean;
  trendingDishDailyPrice: number;
  trendingDishWeeklyPrice: number;
  trendingDishMonthlyPrice: number;
  maxTrendingDishes: number;
  trendingDefaultDurationDays: number;
  trendingDefaultStatus: string;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enableWhatsappNotifications: boolean;
  notifyNewOrderClient: boolean;
  notifyNewOrderRestaurant: boolean;
  notifyOrderAccepted: boolean;
  notifyOrderRejected: boolean;
  notifyDriverAssigned: boolean;
  notifyOrderOnTheWay: boolean;
  notifyOrderDelivered: boolean;
  notifyPaymentConfirmed: boolean;
  notifyPaymentFailed: boolean;
  notifyNewRestaurant: boolean;
  notifyNewDriver: boolean;
  notifyNewSponsoring: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowAdminInMaintenance: boolean;
  disableOrdersTemporarily: boolean;
  disableRestaurantSignup: boolean;
  disableDriverSignup: boolean;
  createdAt: string;
  updatedAt: string;
};

const tabs = [
  { key: "general", label: "Général", icon: Globe },
  { key: "delivery", label: "Livraison", icon: Truck },
  { key: "commissions", label: "Commissions", icon: Percent },
  { key: "payments", label: "Paiements", icon: CreditCard },
  { key: "orders", label: "Commandes", icon: ShoppingBag },
  { key: "restaurants", label: "Restaurants", icon: Store },
  { key: "drivers", label: "Livreurs", icon: Car },
  { key: "sponsoring", label: "Sponsoring", icon: Megaphone },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
];

type SectionKey = (typeof tabs)[number]["key"];

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <label className="flex items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5 cursor-pointer transition hover:shadow-sm">
      <div className="flex-1">
        <p className="text-sm font-black text-dalle-charcoal">{label}</p>
        {description ? <p className="mt-1 text-xs text-neutral-500">{description}</p> : null}
      </div>
      <div className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition", checked ? "bg-dalle-orange" : "bg-neutral-200")}>
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", checked ? "translate-x-5" : "translate-x-1")} />
      </div>
    </label>
  );
}

function NumberField({ label, description, value, onChange, min, max, suffix }: { label: string; description?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string; }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-dalle-charcoal">{label}</p>
        {suffix ? <span className="text-xs font-bold text-neutral-400">{suffix}</span> : null}
      </div>
      {description ? <p className="text-xs text-neutral-500">{description}</p> : null}
      <Input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function TextField({ label, description, value, onChange }: { label: string; description?: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-black text-dalle-charcoal">{label}</p>
      {description ? <p className="text-xs text-neutral-500">{description}</p> : null}
      <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full" />
    </div>
  );
}

export default function PlatformSettingsForm({ initial }: { initial: PlatformSettings }) {
  const [settings, setSettings] = useState<PlatformSettings>(initial);
  const [activeTab, setActiveTab] = useState<SectionKey>("general");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [logs, setLogs] = useState<Array<{ id: string; createdAt: string; admin: { name: string | null; email: string }; metadata: unknown }>>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => { loadLogs(); }, []);

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/admin/settings/audit");
      const data = await res.json();
      if (res.ok) setLogs(data);
    } catch { /* ignore */ }
    setLogsLoading(false);
  }

  function patch<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setSettings((prev: PlatformSettings) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      const keys = Object.keys(settings).filter((k) => k !== "id" && k !== "createdAt" && k !== "updatedAt") as (keyof PlatformSettings)[];
      for (const key of keys) {
        payload[key as string] = settings[key];
      }
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setToast({ type: "success", message: "Paramètres enregistrés avec succès." });
        loadLogs();
      } else {
        setToast({ type: "error", message: data.message || "Erreur lors de la sauvegarde." });
      }
    } catch {
      setToast({ type: "error", message: "Erreur réseau." });
    }
    setSaving(false);
  }

  const renderTab = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <TextField label="Nom de la plateforme" value={settings.platformName} onChange={(v) => patch("platformName", v)} />
            <TextField label="Slogan" value={settings.platformSlogan} onChange={(v) => patch("platformSlogan", v)} />
            <TextField label="Email support" value={settings.supportEmail} onChange={(v) => patch("supportEmail", v)} />
            <TextField label="Téléphone support" value={settings.supportPhone} onChange={(v) => patch("supportPhone", v)} />
            <TextField label="WhatsApp" value={settings.whatsappPhone} onChange={(v) => patch("whatsappPhone", v)} />
            <TextField label="Devise" value={settings.currency} onChange={(v) => patch("currency", v)} />
            <TextField label="Pays" value={settings.country} onChange={(v) => patch("country", v)} />
            <TextField label="Ville par défaut" value={settings.city} onChange={(v) => patch("city", v)} />
          </div>
        );
      case "delivery":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <NumberField label="Frais de livraison par défaut" suffix="F CFA" value={settings.defaultDeliveryFee} onChange={(v) => patch("defaultDeliveryFee", v)} min={0} />
            <NumberField label="Frais par km" suffix="F CFA / km" value={settings.deliveryFeePerKm} onChange={(v) => patch("deliveryFeePerKm", v)} min={0} />
            <NumberField label="Seuil livraison gratuite" suffix="F CFA" value={settings.freeDeliveryThreshold} onChange={(v) => patch("freeDeliveryThreshold", v)} min={0} />
            <NumberField label="Montant minimum commande" suffix="F CFA" value={settings.minOrderAmount} onChange={(v) => patch("minOrderAmount", v)} min={0} />
            <NumberField label="Distance max livraison" suffix="km" value={settings.maxDeliveryDistanceKm} onChange={(v) => patch("maxDeliveryDistanceKm", v)} min={1} />
            <NumberField label="Temps estimé préparation" suffix="min" value={settings.estimatedPrepTimeMin} onChange={(v) => patch("estimatedPrepTimeMin", v)} min={0} />
            <NumberField label="Temps estimé livraison" suffix="min" value={settings.estimatedDeliveryTimeMin} onChange={(v) => patch("estimatedDeliveryTimeMin", v)} min={0} />
          </div>
        );
      case "commissions":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <NumberField label="Commission restaurant" suffix="%" value={settings.restaurantCommissionRate} onChange={(v) => patch("restaurantCommissionRate", v)} min={0} max={100} />
            <NumberField label="Commission livraison" suffix="%" value={settings.deliveryCommissionRate} onChange={(v) => patch("deliveryCommissionRate", v)} min={0} max={100} />
            <NumberField label="Frais de service plateforme" suffix="F CFA" value={settings.platformServiceFee} onChange={(v) => patch("platformServiceFee", v)} min={0} />
            <NumberField label="Délai reversement restaurant" suffix="jours" value={settings.restaurantPayoutDelayDays} onChange={(v) => patch("restaurantPayoutDelayDays", v)} min={0} />
            <NumberField label="Délai reversement livreur" suffix="jours" value={settings.driverPayoutDelayDays} onChange={(v) => patch("driverPayoutDelayDays", v)} min={0} />
          </div>
        );
      case "payments":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Toggle label="Paiement espèces" checked={settings.allowCashPayment} onChange={(v) => patch("allowCashPayment", v)} />
            <Toggle label="Paiement Mobile Money" checked={settings.allowMobileMoneyPayment} onChange={(v) => patch("allowMobileMoneyPayment", v)} />
            <Toggle label="Paiement par carte" checked={settings.allowCardPayment} onChange={(v) => patch("allowCardPayment", v)} />
          </div>
        );
      case "orders":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Toggle label="Acceptation automatique" description="Accepter automatiquement les nouvelles commandes" checked={settings.autoAcceptOrders} onChange={(v) => patch("autoAcceptOrders", v)} />
            <Toggle label="Annulation auto non payées" description="Annuler les commandes non payées après le délai" checked={settings.autoCancelUnpaidOrders} onChange={(v) => patch("autoCancelUnpaidOrders", v)} />
            <NumberField label="Délai d'annulation auto" suffix="min" value={settings.autoCancelDelayMinutes} onChange={(v) => patch("autoCancelDelayMinutes", v)} min={1} />
            <Toggle label="Client peut annuler" checked={settings.allowClientOrderCancellation} onChange={(v) => patch("allowClientOrderCancellation", v)} />
            <Toggle label="Restaurant peut annuler" checked={settings.allowRestaurantOrderCancellation} onChange={(v) => patch("allowRestaurantOrderCancellation", v)} />
            <NumberField label="Fenêtre d'annulation client" suffix="min" value={settings.clientCancellationWindowMin} onChange={(v) => patch("clientCancellationWindowMin", v)} min={0} />
          </div>
        );
      case "restaurants":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Toggle label="Validation manuelle restaurants" description="Les nouveaux restaurants doivent être approuvés" checked={settings.manualRestaurantApproval} onChange={(v) => patch("manualRestaurantApproval", v)} />
            <Toggle label="Restaurants gèrent leurs produits" checked={settings.allowRestaurantSelfProducts} onChange={(v) => patch("allowRestaurantSelfProducts", v)} />
            <Toggle label="Restaurants modifient les prix" checked={settings.allowRestaurantPriceEdit} onChange={(v) => patch("allowRestaurantPriceEdit", v)} />
            <Toggle label="Masquer restaurants fermés" checked={settings.autoHideClosedRestaurants} onChange={(v) => patch("autoHideClosedRestaurants", v)} />
            <NumberField label="Note minimum mise en avant" suffix="/ 5" value={settings.minRatingForFeature} onChange={(v) => patch("minRatingForFeature", v)} min={0} max={5} />
          </div>
        );
      case "drivers":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Toggle label="Validation manuelle livreurs" checked={settings.manualDriverApproval} onChange={(v) => patch("manualDriverApproval", v)} />
            <Toggle label="Assignation auto des livreurs" checked={settings.enableAutoDriverAssign} onChange={(v) => patch("enableAutoDriverAssign", v)} />
            <NumberField label="Rayon de recherche livreurs" suffix="km" value={settings.driverSearchRadiusKm} onChange={(v) => patch("driverSearchRadiusKm", v)} min={1} />
            <NumberField label="Timeout d'acceptation" suffix="sec" value={settings.driverAcceptTimeoutSec} onChange={(v) => patch("driverAcceptTimeoutSec", v)} min={10} />
            <NumberField label="Frais minimum livreur" suffix="F CFA" value={settings.driverMinFee} onChange={(v) => patch("driverMinFee", v)} min={0} />
            <Toggle label="Bonus de livraison" checked={settings.driverDeliveryBonusEnabled} onChange={(v) => patch("driverDeliveryBonusEnabled", v)} />
            <Toggle label="Autoriser le refus" checked={settings.allowDriverRefusal} onChange={(v) => patch("allowDriverRefusal", v)} />
          </div>
        );
      case "sponsoring":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Toggle label="Activer restaurants sponsorisés" checked={settings.enableSponsoredRestaurants} onChange={(v) => patch("enableSponsoredRestaurants", v)} />
              <NumberField label="Max restaurants sponsorisés" value={settings.maxSponsoredRestaurants} onChange={(v) => patch("maxSponsoredRestaurants", v)} min={1} />
              <NumberField label="Prix / jour restaurant" suffix="F CFA" value={settings.sponsoredRestaurantDailyPrice} onChange={(v) => patch("sponsoredRestaurantDailyPrice", v)} min={0} />
              <NumberField label="Prix / semaine restaurant" suffix="F CFA" value={settings.sponsoredRestaurantWeeklyPrice} onChange={(v) => patch("sponsoredRestaurantWeeklyPrice", v)} min={0} />
              <NumberField label="Prix / mois restaurant" suffix="F CFA" value={settings.sponsoredRestaurantMonthlyPrice} onChange={(v) => patch("sponsoredRestaurantMonthlyPrice", v)} min={0} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Toggle label="Activer plats tendances" checked={settings.enableTrendingDishes} onChange={(v) => patch("enableTrendingDishes", v)} />
              <NumberField label="Max plats tendances" value={settings.maxTrendingDishes} onChange={(v) => patch("maxTrendingDishes", v)} min={1} />
              <NumberField label="Prix / jour plat" suffix="F CFA" value={settings.trendingDishDailyPrice} onChange={(v) => patch("trendingDishDailyPrice", v)} min={0} />
              <NumberField label="Prix / semaine plat" suffix="F CFA" value={settings.trendingDishWeeklyPrice} onChange={(v) => patch("trendingDishWeeklyPrice", v)} min={0} />
              <NumberField label="Prix / mois plat" suffix="F CFA" value={settings.trendingDishMonthlyPrice} onChange={(v) => patch("trendingDishMonthlyPrice", v)} min={0} />
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Toggle label="Notifications push" checked={settings.enablePushNotifications} onChange={(v) => patch("enablePushNotifications", v)} />
              <Toggle label="Notifications email" checked={settings.enableEmailNotifications} onChange={(v) => patch("enableEmailNotifications", v)} />
              <Toggle label="Notifications SMS" checked={settings.enableSmsNotifications} onChange={(v) => patch("enableSmsNotifications", v)} />
              <Toggle label="Notifications WhatsApp" checked={settings.enableWhatsappNotifications} onChange={(v) => patch("enableWhatsappNotifications", v)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Toggle label="Nouvelle commande — Client" checked={settings.notifyNewOrderClient} onChange={(v) => patch("notifyNewOrderClient", v)} />
              <Toggle label="Nouvelle commande — Restaurant" checked={settings.notifyNewOrderRestaurant} onChange={(v) => patch("notifyNewOrderRestaurant", v)} />
              <Toggle label="Commande acceptée" checked={settings.notifyOrderAccepted} onChange={(v) => patch("notifyOrderAccepted", v)} />
              <Toggle label="Commande rejetée" checked={settings.notifyOrderRejected} onChange={(v) => patch("notifyOrderRejected", v)} />
              <Toggle label="Livreur assigné" checked={settings.notifyDriverAssigned} onChange={(v) => patch("notifyDriverAssigned", v)} />
              <Toggle label="En cours de livraison" checked={settings.notifyOrderOnTheWay} onChange={(v) => patch("notifyOrderOnTheWay", v)} />
              <Toggle label="Commande livrée" checked={settings.notifyOrderDelivered} onChange={(v) => patch("notifyOrderDelivered", v)} />
              <Toggle label="Paiement confirmé" checked={settings.notifyPaymentConfirmed} onChange={(v) => patch("notifyPaymentConfirmed", v)} />
              <Toggle label="Paiement échoué" checked={settings.notifyPaymentFailed} onChange={(v) => patch("notifyPaymentFailed", v)} />
              <Toggle label="Nouveau restaurant" checked={settings.notifyNewRestaurant} onChange={(v) => patch("notifyNewRestaurant", v)} />
              <Toggle label="Nouveau livreur" checked={settings.notifyNewDriver} onChange={(v) => patch("notifyNewDriver", v)} />
              <Toggle label="Nouveau sponsoring" checked={settings.notifyNewSponsoring} onChange={(v) => patch("notifyNewSponsoring", v)} />
            </div>
          </div>
        );
      case "maintenance":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Toggle label="Mode maintenance" description="Bloquer l'accès public" checked={settings.maintenanceMode} onChange={(v) => patch("maintenanceMode", v)} />
            <Toggle label="Autoriser admin en maintenance" checked={settings.allowAdminInMaintenance} onChange={(v) => patch("allowAdminInMaintenance", v)} />
            <TextField label="Message maintenance" value={settings.maintenanceMessage} onChange={(v) => patch("maintenanceMessage", v)} />
            <Toggle label="Désactiver temporairement les commandes" checked={settings.disableOrdersTemporarily} onChange={(v) => patch("disableOrdersTemporarily", v)} />
            <Toggle label="Désactiver inscription restaurants" checked={settings.disableRestaurantSignup} onChange={(v) => patch("disableRestaurantSignup", v)} />
            <Toggle label="Désactiver inscription livreurs" checked={settings.disableDriverSignup} onChange={(v) => patch("disableDriverSignup", v)} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn("rounded-2xl px-5 py-3 text-sm font-black shadow-sm", toast.type === "success" ? "bg-dalle-lime text-dalle-charcoal" : "bg-red-100 text-red-700")}>
          {toast.message}
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Mobile horizontal scroll tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-black/5 p-3 md:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "shrink-0 rounded-xl px-3 py-2 text-xs font-black transition",
                activeTab === t.key ? "bg-dalle-orange text-white" : "bg-neutral-100 text-neutral-600"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Desktop sidebar tabs */}
        <div className="flex">
          <div className="hidden w-56 shrink-0 flex-col gap-1 border-r border-black/5 p-3 md:flex">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition",
                    activeTab === t.key ? "bg-dalle-orange/10 text-dalle-orange" : "text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-dalle-charcoal">
                {tabs.find((t) => t.key === activeTab)?.label}
              </h3>
              <Badge variant="soft">{tabs.find((t) => t.key === activeTab)?.label}</Badge>
            </div>
            {renderTab()}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button onClick={save} disabled={saving} className="min-w-[140px]">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Audit log */}
      <Card className="p-5">
        <h3 className="text-lg font-black text-dalle-charcoal">Dernières modifications</h3>
        {logsLoading ? (
          <p className="mt-3 text-sm text-neutral-500">Chargement...</p>
        ) : logs.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Aucun historique disponible.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="rounded-xl bg-neutral-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-dalle-charcoal">{log.admin.name ?? log.admin.email}</span>
                  <span className="text-xs text-neutral-400">{new Date(log.createdAt).toLocaleString("fr-FR")}</span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Modifications :{" "}
                  {typeof log.metadata === "object" && log.metadata !== null
                    ? Object.keys(log.metadata as Record<string, unknown>).join(", ")
                    : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
