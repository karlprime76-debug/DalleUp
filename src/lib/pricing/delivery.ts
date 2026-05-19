import { site } from "@/lib/site";

export function getDeliveryFee(zone?: string) {
  if (zone?.toLowerCase().includes("centre")) return 800;
  if (zone?.toLowerCase().includes("calavi")) return 1500;
  return site.deliveryFee;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0
  }).format(amount);
}
