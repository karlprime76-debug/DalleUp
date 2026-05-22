export const DELIVERY_BASE_FEE = 500;
export const DELIVERY_PER_KM = 150;
export const DELIVERY_MINIMUM_FEE = 700;
export const DELIVERY_ROUNDING = 50;

const ZONE_FEES: Record<string, number> = {
  "akpakpa": 700,
  "calavi": 1500,
  "centre-ville": 800,
  "centre ville": 800,
  "centre": 800,
  "cotonou-centre": 800,
  "fidjrossè": 900,
  "fidjrosse": 900,
  "ganhi": 800,
  "godomey": 1300,
  "houéyiho": 1000,
  "houeyiho": 1000,
  "jéricho": 900,
  "jericho": 900,
  "ladji": 1200,
  "menontin": 900,
  "missérété": 1100,
  "miserete": 1100,
  "ouédomey": 1000,
  "ouedomey": 1000,
  "ste-rade": 1000,
  "ste rade": 1000,
  "sainte-rade": 1000,
  "vêdoko": 900,
  "vedoko": 900,
  "zongo": 800,
};

export function roundToNearestFee(amount: number): number {
  return Math.round(amount / DELIVERY_ROUNDING) * DELIVERY_ROUNDING;
}

export function calculateDeliveryFeeByDistance(distanceKm: number): number {
  if (distanceKm <= 0) return DELIVERY_MINIMUM_FEE;
  const fee = DELIVERY_BASE_FEE + distanceKm * DELIVERY_PER_KM;
  const rounded = roundToNearestFee(fee);
  return Math.max(rounded, DELIVERY_MINIMUM_FEE);
}

export function calculateDeliveryFeeByZone(zone: string): number | null {
  const normalized = zone.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const fee = ZONE_FEES[normalized];
  if (fee !== undefined) return fee;
  // try partial match
  for (const [key, value] of Object.entries(ZONE_FEES)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  return null;
}

export type DeliveryFeeInput = {
  distanceKm?: number | null;
  zone?: string | null;
  fromLat?: number | null;
  fromLng?: number | null;
  toLat?: number | null;
  toLng?: number | null;
};

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDeliveryFeeEstimate(input: DeliveryFeeInput): number | null {
  if (
    input.fromLat != null &&
    input.fromLng != null &&
    input.toLat != null &&
    input.toLng != null
  ) {
    const distanceKm = calculateHaversineDistance(input.fromLat, input.fromLng, input.toLat, input.toLng);
    return calculateDeliveryFeeByDistance(distanceKm);
  }
  if (input.distanceKm != null && input.distanceKm > 0) {
    return calculateDeliveryFeeByDistance(input.distanceKm);
  }
  if (input.zone != null && input.zone.trim().length > 0) {
    return calculateDeliveryFeeByZone(input.zone);
  }
  return null;
}

export function getZoneOptions(): string[] {
  return [
    "Akpakpa",
    "Calavi",
    "Centre-ville",
    "Fidjrossè",
    "Ganhi",
    "Godomey",
    "Houéyiho",
    "Jéricho",
    "Ladji",
    "Menontin",
    "Missérété",
    "Ouédomey",
    "Sainte-Rade",
    "Vêdoko",
    "Zongo",
    "Autre",
  ];
}
