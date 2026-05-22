import { BENIN_PLACES, type BeninPlace } from "./benin-places";

const ACCENT_MAP: Record<string, string> = {
  à: "a", á: "a", â: "a", ä: "a", ã: "a", å: "a", ā: "a",
  è: "e", é: "e", ê: "e", ë: "e", ē: "e",
  ì: "i", í: "i", î: "i", ï: "i", ī: "i",
  ò: "o", ó: "o", ô: "o", ö: "o", õ: "o", ø: "o", ō: "o",
  ù: "u", ú: "u", û: "u", ü: "u", ū: "u",
  ý: "y", ÿ: "y",
  ç: "c", ñ: "n",
  À: "A", Á: "A", Â: "A", Ä: "A", Ã: "A", Å: "A", Ā: "A",
  È: "E", É: "E", Ê: "E", Ë: "E", Ē: "E",
  Ì: "I", Í: "I", Î: "I", Ï: "I", Ī: "I",
  Ò: "O", Ó: "O", Ô: "O", Ö: "O", Õ: "O", Ø: "O", Ō: "O",
  Ù: "U", Ú: "U", Û: "U", Ü: "U", Ū: "U",
  Ý: "Y", Ÿ: "Y",
  Ç: "C", Ñ: "N",
};

export function removeAccents(text: string): string {
  return text
    .split("")
    .map((char) => ACCENT_MAP[char] ?? char)
    .join("");
}

export function normalizePlaceText(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalizePlaceText(text).split(" ").filter((t) => t.length > 0);
}

function matchScore(queryTokens: string[], place: BeninPlace): number {
  const normalizedQuery = queryTokens.join(" ");
  const nameTokens = tokenize(place.name);
  const aliasTokens = place.aliases.flatMap((a) => tokenize(a));
  const allTokens = [...nameTokens, ...aliasTokens];

  let score = 0;

  // Exact match on normalized name
  if (place.normalizedName === normalizedQuery) score += 100;
  if (place.normalizedName.startsWith(normalizedQuery)) score += 80;

  // Alias exact / prefix
  for (const alias of place.aliases) {
    const norm = normalizePlaceText(alias);
    if (norm === normalizedQuery) score += 90;
    if (norm.startsWith(normalizedQuery)) score += 70;
  }

  // Token overlap
  for (const qt of queryTokens) {
    for (const nt of allTokens) {
      if (nt === qt) score += 30;
      else if (nt.startsWith(qt)) score += 20;
      else if (nt.includes(qt)) score += 10;
    }
  }

  // Priority boost
  score += place.priority * 5;

  // Serviceable boost
  if (place.isServiceable) score += 15;

  return score;
}

export function searchBeninPlaces(query: string, limit = 8): BeninPlace[] {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const queryTokens = tokenize(trimmed);
  if (queryTokens.length === 0) return [];

  const scored = BENIN_PLACES.map((place) => ({
    place,
    score: matchScore(queryTokens, place),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Keep only places with some relevance
  const minScore = 5;
  return scored
    .filter((s) => s.score >= minScore)
    .slice(0, limit)
    .map((s) => s.place);
}

export function getPlaceById(id: string): BeninPlace | undefined {
  return BENIN_PLACES.find((p) => p.id === id);
}

export function getServiceableCities(): string[] {
  const cities = new Set<string>();
  for (const place of BENIN_PLACES) {
    if (place.isServiceable && place.city) cities.add(place.city);
  }
  return Array.from(cities).sort();
}
