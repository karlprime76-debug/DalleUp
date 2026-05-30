import { PrismaClient } from "@prisma/client";
import {
  buildPlaceSlug,
  computePopularityScore,
  normalizePlaceName,
} from "../src/lib/places/normalize";

const prisma = new PrismaClient();

async function seed() {
  console.log("[seed-core-places] Starting…");

  await upsertPlace({
    name: "Bénin",
    slug: "benin",
    normalizedName: "benin",
    type: "COUNTRY",
    country: "Bénin",
    isPublic: true,
    isVerified: true,
    popularityScore: 100,
  });

  const littoral = await upsertPlace({
    name: "Littoral",
    slug: "littoral",
    normalizedName: "littoral",
    type: "DEPARTMENT",
    country: "Bénin",
    isPublic: true,
    isVerified: true,
    popularityScore: 100,
  });

  const atlantique = await upsertPlace({
    name: "Atlantique",
    slug: "atlantique",
    normalizedName: "atlantique",
    type: "DEPARTMENT",
    country: "Bénin",
    isPublic: true,
    isVerified: true,
    popularityScore: 100,
  });

  const oueme = await upsertPlace({
    name: "Ouémé",
    slug: "oueme",
    normalizedName: "oueme",
    type: "DEPARTMENT",
    country: "Bénin",
    isPublic: true,
    isVerified: true,
    popularityScore: 100,
  });

  const communes = [
    { name: "Cotonou", deptId: littoral.id, lat: 6.36536, lng: 2.41833 },
    { name: "Abomey-Calavi", deptId: atlantique.id, lat: 6.44885, lng: 2.35566 },
    { name: "Sèmè-Kpodji", deptId: oueme.id, lat: 6.39111, lng: 2.61667 },
    { name: "Porto-Novo", deptId: oueme.id, lat: 6.49685, lng: 2.62831 },
    { name: "Ouidah", deptId: atlantique.id, lat: 6.36332, lng: 2.08524 },
  ];

  for (const c of communes) {
    const slug = buildPlaceSlug(c.name, undefined, "commune");
    await upsertPlace({
      name: c.name,
      slug,
      normalizedName: normalizePlaceName(c.name),
      type: "COMMUNE",
      country: "Bénin",
      commune: c.name,
      city: c.name,
      latitude: c.lat,
      longitude: c.lng,
      isPublic: true,
      isVerified: true,
      popularityScore: 100,
      parentId: c.deptId,
    });
  }

  const neighborhoods: Array<{
    name: string;
    commune: string;
    lat: number;
    lng: number;
  }> = [
    // Cotonou
    { name: "Fidjrossè", commune: "Cotonou", lat: 6.353, lng: 2.385 },
    { name: "Cadjehoun", commune: "Cotonou", lat: 6.36, lng: 2.4 },
    { name: "Akpakpa", commune: "Cotonou", lat: 6.375, lng: 2.42 },
    { name: "Ganhi", commune: "Cotonou", lat: 6.355, lng: 2.43 },
    { name: "Jonquet", commune: "Cotonou", lat: 6.365, lng: 2.44 },
    { name: "Zongo", commune: "Cotonou", lat: 6.37, lng: 2.445 },
    { name: "Dantokpa", commune: "Cotonou", lat: 6.37, lng: 2.415 },
    { name: "Saint-Michel", commune: "Cotonou", lat: 6.36, lng: 2.41 },
    { name: "Houéyiho", commune: "Cotonou", lat: 6.345, lng: 2.39 },
    { name: "Vedoko", commune: "Cotonou", lat: 6.35, lng: 2.395 },
    { name: "Tokpligbodji", commune: "Cotonou", lat: 6.34, lng: 2.38 },
    { name: "Ancien Pont", commune: "Cotonou", lat: 6.355, lng: 2.405 },
    { name: "Zone des pêches", commune: "Cotonou", lat: 6.33, lng: 2.36 },
    // Abomey-Calavi
    { name: "Calavi-Kpota", commune: "Abomey-Calavi", lat: 6.46, lng: 2.36 },
    { name: "Godomey", commune: "Abomey-Calavi", lat: 6.475, lng: 2.34 },
    { name: "Glo-Djigbé", commune: "Abomey-Calavi", lat: 6.49, lng: 2.32 },
    { name: "Hêvié", commune: "Abomey-Calavi", lat: 6.44, lng: 2.37 },
    { name: "Tankpè", commune: "Abomey-Calavi", lat: 6.42, lng: 2.35 },
    { name: "Zinvié", commune: "Abomey-Calavi", lat: 6.41, lng: 2.33 },
    // Porto-Novo
    { name: "Ajahon", commune: "Porto-Novo", lat: 6.51, lng: 2.63 },
    { name: "Akonabè", commune: "Porto-Novo", lat: 6.5, lng: 2.62 },
    { name: "Ouando", commune: "Porto-Novo", lat: 6.49, lng: 2.61 },
    // Ouidah
    { name: "Pahou", commune: "Ouidah", lat: 6.37, lng: 2.08 },
    { name: "Cococodji", commune: "Ouidah", lat: 6.38, lng: 2.1 },
    { name: "Avlékété", commune: "Ouidah", lat: 6.35, lng: 2.07 },
    // Sèmè-Kpodji
    { name: "Agblangandan", commune: "Sèmè-Kpodji", lat: 6.4, lng: 2.62 },
  ];

  for (const n of neighborhoods) {
    const slug = buildPlaceSlug(n.name, n.commune, "neighborhood");
    await upsertPlace({
      name: n.name,
      slug,
      normalizedName: normalizePlaceName(n.name),
      type: "NEIGHBORHOOD",
      country: "Bénin",
      commune: n.commune,
      city: n.commune,
      latitude: n.lat,
      longitude: n.lng,
      isPublic: true,
      isVerified: true,
      popularityScore: 100,
    });
  }

  const landmarks: Array<{
    name: string;
    commune: string;
    type: "ROUNDABOUT" | "MARKET" | "TRANSPORT_HUB" | "HOSPITAL" | "UNIVERSITY" | "PHARMACY" | "LANDMARK" | "BEACH";
    lat: number;
    lng: number;
  }> = [
    { name: "Carrefour Ganhi", commune: "Cotonou", type: "ROUNDABOUT", lat: 6.355, lng: 2.43 },
    { name: "Carrefour des Cocotiers", commune: "Cotonou", type: "ROUNDABOUT", lat: 6.36, lng: 2.425 },
    { name: "Carrefour Saint-Michel", commune: "Cotonou", type: "ROUNDABOUT", lat: 6.36, lng: 2.41 },
    { name: "Carrefour Jonquet", commune: "Cotonou", type: "ROUNDABOUT", lat: 6.365, lng: 2.44 },
    { name: "Marché Dantokpa", commune: "Cotonou", type: "MARKET", lat: 6.37, lng: 2.415 },
    { name: "Marché Missebo", commune: "Cotonou", type: "MARKET", lat: 6.355, lng: 2.42 },
    { name: "CHU Cotonou (CNHU)", commune: "Cotonou", type: "HOSPITAL", lat: 6.345, lng: 2.385 },
    { name: "Hôpital de zone Cotonou", commune: "Cotonou", type: "HOSPITAL", lat: 6.36, lng: 2.4 },
    { name: "Université d’Abomey-Calavi", commune: "Abomey-Calavi", type: "UNIVERSITY", lat: 6.42, lng: 2.33 },
    { name: "Plage Fidjrossè", commune: "Cotonou", type: "BEACH", lat: 6.35, lng: 2.385 },
    { name: "Gare routière Cotonou", commune: "Cotonou", type: "TRANSPORT_HUB", lat: 6.365, lng: 2.405 },
    { name: "Pharmacie Camp Guézo", commune: "Cotonou", type: "PHARMACY", lat: 6.355, lng: 2.395 },
    { name: "Stade de l’Amitié", commune: "Cotonou", type: "LANDMARK", lat: 6.365, lng: 2.395 },
  ];

  for (const l of landmarks) {
    const slug = buildPlaceSlug(l.name, l.commune, l.type);
    await upsertPlace({
      name: l.name,
      slug,
      normalizedName: normalizePlaceName(l.name),
      type: l.type,
      country: "Bénin",
      commune: l.commune,
      city: l.commune,
      latitude: l.lat,
      longitude: l.lng,
      isPublic: true,
      isVerified: true,
      popularityScore: computePopularityScore(l.type, true, "ADMIN"),
    });
  }

  console.log("[seed-core-places] Done.");
}

type UpsertPlaceInput = {
  name: string;
  slug: string;
  normalizedName: string;
  type: string;
  country: string;
  commune?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isPublic: boolean;
  isVerified: boolean;
  popularityScore: number;
  parentId?: string;
};

async function upsertPlace(data: UpsertPlaceInput) {
  const existing = await prisma.place.findFirst({
    where: {
      OR: [{ slug: data.slug }, { normalizedName: data.normalizedName, commune: data.commune ?? undefined }],
    },
  });
  if (existing) {
    console.log(`  [skip] ${data.name}`);
    return existing;
  }
  const created = await prisma.place.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { ...data, source: "ADMIN" } as any,
  });
  console.log(`  [created] ${data.name}`);
  return created;
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
