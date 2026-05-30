import { prisma } from "@/lib/db/prisma";
import { isProbablyDuplicate, normalizePlaceName } from "./normalize";

export async function findDuplicatePlaceCandidate(place: {
  name: string;
  commune?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  osmId?: string | null;
}) {
  const normalized = normalizePlaceName(place.name);
  const candidates = await prisma.place.findMany({
    where: {
      OR: [
        { googlePlaceId: place.googlePlaceId ?? undefined },
        { osmId: place.osmId ?? undefined },
        { normalizedName: { startsWith: normalized.slice(0, 8) } },
      ],
    },
    take: 20,
  });

  for (const candidate of candidates) {
    if (
      isProbablyDuplicate(place, {
        name: candidate.name,
        commune: candidate.commune,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        googlePlaceId: candidate.googlePlaceId,
        osmId: candidate.osmId,
      })
    ) {
      return candidate;
    }
  }
  return null;
}
