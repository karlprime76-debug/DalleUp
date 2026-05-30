export function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function slugify(name: string) {
  return removeAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const VARIANTS: Record<string, string[]> = {
  "fidjrosse": ["fidjrosse", "fidjrosse"],
  "cadjehoun": ["cadjehoun", "cadjehoun"],
  "seme": ["seme", "seme"],
  "glodjigbe": ["glodjigbe", "glo-djigbe", "golo-djigbe"],
  "godomey": ["godomey", "godome"],
  "dantokpa": ["dantokpa", "tokpa"],
  "carrefour": ["carrefour", "c-fr", "cfr"],
};

export function normalizePlaceName(name: string) {
  let n = removeAccents(name)
    .toLowerCase()
    .replace(/[-_']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [canonical, variants] of Object.entries(VARIANTS)) {
    for (const v of variants) {
      const re = new RegExp(`\\b${v.replace(/[-]/g, "[-]?")}\\b`, "g");
      n = n.replace(re, canonical);
    }
  }
  return n;
}

export function normalizePlaceNameForSearch(name: string) {
  return normalizePlaceName(name).replace(/\s+/g, "");
}

export function computePlaceSlug(name: string) {
  return slugify(name);
}

export function isNameVariant(a: string, b: string) {
  return normalizePlaceName(a) === normalizePlaceName(b);
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getBaseScore(type: string) {
  switch (type) {
    case "NEIGHBORHOOD":
    case "COMMUNE":
      return 100;
    case "MARKET":
    case "ROUNDABOUT":
    case "TRANSPORT_HUB":
      return 90;
    case "HOSPITAL":
    case "UNIVERSITY":
    case "PHARMACY":
      return 80;
    case "RESTAURANT":
    case "MAQUIS":
    case "BAR":
    case "BUVETTE":
    case "LOUNGE":
    case "GYM":
    case "SPORTS_CENTER":
      return 70;
    case "SUPERMARKET":
    case "MINI_MARKET":
    case "SHOP":
    case "BAKERY":
    case "PASTRY_SHOP":
    case "CAFE":
    case "FAST_FOOD":
    case "GAS_STATION":
    case "BANK":
    case "ATM":
    case "HOTEL":
    case "CLINIC":
    case "SCHOOL":
    case "CHURCH":
    case "MOSQUE":
    case "ADMIN_BUILDING":
      return 50;
    case "BUILDING":
    case "RESIDENCE":
    case "HOUSE_LANDMARK":
      return 30;
    case "PRIVATE_HOME":
      return 0;
    default:
      return 20;
  }
}

export function assignBuvetteType(name: string): "BUVETTE" | "BAR" | "LOUNGE" | "NIGHTCLUB" | "MAQUIS" {
  const n = normalizePlaceName(name);
  if (n.includes("club") || n.includes("vip") || n.includes("night")) return "NIGHTCLUB";
  if (n.includes("lounge") || n.includes("chill") || n.includes("terrasse")) return "LOUNGE";
  if (n.includes("maquis")) return "MAQUIS";
  if (n.includes("bar")) return "BAR";
  if (n.includes("buvette")) return "BUVETTE";
  return "BUVETTE";
}

export function mapOsmTagsToPlaceType(
  tags: Record<string, string>
): string | null {
  const amenity = tags.amenity?.toLowerCase();
  const shop = tags.shop?.toLowerCase();
  const leisure = tags.leisure?.toLowerCase();
  const tourism = tags.tourism?.toLowerCase();
  const building = tags.building?.toLowerCase();
  const religion = tags.religion?.toLowerCase();

  if (amenity === "bar" || amenity === "pub") return "BAR";
  if (amenity === "cafe") return "CAFE";
  if (amenity === "restaurant") return "RESTAURANT";
  if (amenity === "fast_food" || amenity === "food_court") return "FAST_FOOD";
  if (amenity === "pharmacy") return "PHARMACY";
  if (amenity === "clinic") return "CLINIC";
  if (amenity === "hospital") return "HOSPITAL";
  if (amenity === "school") return "SCHOOL";
  if (amenity === "university") return "UNIVERSITY";
  if (amenity === "bank") return "BANK";
  if (amenity === "atm") return "ATM";
  if (amenity === "fuel") return "GAS_STATION";
  if (amenity === "place_of_worship" && religion === "christian") return "CHURCH";
  if (amenity === "place_of_worship" && religion === "muslim") return "MOSQUE";

  if (shop === "supermarket") return "SUPERMARKET";
  if (shop === "convenience") return "MINI_MARKET";
  if (shop === "bakery") return "BAKERY";
  if (shop === "pastry") return "PASTRY_SHOP";
  if (shop === "mall") return "SHOP";
  if (shop) return "SHOP";

  if (leisure === "fitness_centre") return "GYM";
  if (leisure === "sports_centre") return "SPORTS_CENTER";
  if (leisure === "pitch") return "FOOTBALL_FIELD";

  if (tourism === "hotel") return "HOTEL";
  if (tourism === "attraction") return "TOURIST_PLACE";

  if (building === "apartments") return "BUILDING";
  if (building === "residential") return "RESIDENCE";
  if (building === "commercial") return "BUILDING";

  return null;
}

export function mapGoogleTypeToPlaceType(type: string): string | null {
  const t = type.toLowerCase().replace(/_/g, " ");
  if (t.includes("restaurant")) return "RESTAURANT";
  if (t.includes("meal takeaway")) return "FAST_FOOD";
  if (t.includes("cafe")) return "CAFE";
  if (t.includes("bar")) return "BAR";
  if (t.includes("bakery")) return "BAKERY";
  if (t.includes("gym")) return "GYM";
  if (t.includes("supermarket")) return "SUPERMARKET";
  if (t.includes("convenience")) return "MINI_MARKET";
  if (t.includes("pharmacy")) return "PHARMACY";
  if (t.includes("hospital")) return "HOSPITAL";
  if (t.includes("doctor")) return "CLINIC";
  if (t.includes("school")) return "SCHOOL";
  if (t.includes("university")) return "UNIVERSITY";
  if (t.includes("church")) return "CHURCH";
  if (t.includes("mosque")) return "MOSQUE";
  if (t.includes("bank")) return "BANK";
  if (t.includes("atm")) return "ATM";
  if (t.includes("gas station")) return "GAS_STATION";
  if (t.includes("lodging")) return "HOTEL";
  if (t.includes("shopping mall")) return "SHOP";
  if (t.includes("store")) return "SHOP";
  return null;
}

export function buildPlaceSlug(name: string, commune?: string | null, type?: string | null) {
  const parts = [slugify(name)];
  if (commune) parts.push(slugify(commune));
  if (type) parts.push(slugify(type));
  return parts.join("-");
}

export function computePopularityScore(type: string, isVerified: boolean, source: string) {
  let score = getBaseScore(type);
  if (isVerified) score += 15;
  if (source === "ADMIN" || source === "MANUAL") score += 10;
  if (source === "USER_SUGGESTION" || source === "DRIVER_SUGGESTION" || source === "RESTAURANT_SUGGESTION") score += 5;
  return score;
}

export function isProbablyDuplicate(
  a: { name: string; commune?: string | null; latitude?: number | null; longitude?: number | null; googlePlaceId?: string | null; osmId?: string | null },
  b: { name: string; commune?: string | null; latitude?: number | null; longitude?: number | null; googlePlaceId?: string | null; osmId?: string | null }
): boolean {
  if (a.googlePlaceId && a.googlePlaceId === b.googlePlaceId) return true;
  if (a.osmId && a.osmId === b.osmId) return true;
  if (!isNameVariant(a.name, b.name)) return false;
  if (a.commune && b.commune && normalizePlaceName(a.commune) !== normalizePlaceName(b.commune)) return false;
  if (a.latitude != null && a.longitude != null && b.latitude != null && b.longitude != null) {
    const d = haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
    if (d < 80) return true;
  }
  return false;
}

export function sanitizePlaceName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}
