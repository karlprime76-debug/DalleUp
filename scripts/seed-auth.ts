/**
 * Script de seed des comptes de test propres.
 *
 * Exécution directe :
 *   npx tsx scripts/seed-auth.ts
 *
 * Variables d'environnement requises :
 *   - ADMIN_SEED_PASSWORD   (min 8 caractères)
 *   - TEST_SEED_PASSWORD    (min 8 caractères — client, restaurant, livreur)
 *
 * Ne jamais hardcoder les mots de passe dans ce fichier.
 */
import { PrismaClient, DriverStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadScriptEnv } from "./lib/load-env.js";

export function requireSeedEnv(name: string, minLength = 1): string {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    throw new Error(`La variable d'environnement ${name} est manquante ou trop courte (min ${minLength} caractères).`);
  }
  return value;
}

async function ensureUser(
  prisma: PrismaClient,
  data: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "CLIENT" | "RESTAURANT" | "DELIVERY_DRIVER";
    vehicleType?: string;
    city?: string;
    driverStatus?: DriverStatus;
  }
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    console.log(`   ℹ️  ${data.email} existe déjà — ignoré.`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      vehicleType: data.vehicleType || null,
      city: data.city || null,
      driverStatus: data.driverStatus || "PENDING",
    },
  });

  if (data.role === "RESTAURANT") {
    const baseSlug = data.email.split("@")[0].replace(/[^a-z0-9]+/g, "-");
    await prisma.restaurant.create({
      data: {
        ownerId: user.id,
        name: `Restaurant ${data.name}`,
        slug: `${baseSlug}-${Date.now().toString(36)}`,
        description: "Restaurant de test",
        address: "Cotonou, Bénin",
        phone: null,
        status: "APPROVED",
      },
    });
  }

  console.log(`   ✅  ${data.email} créé (${data.role}).`);
  return user;
}

export async function seedAuthAccounts(prisma: PrismaClient): Promise<void> {
  const adminPassword = requireSeedEnv("ADMIN_SEED_PASSWORD", 8);
  const testPassword = requireSeedEnv("TEST_SEED_PASSWORD", 8);

  console.log("\n🌱  CRÉATION DES COMPTES DE TEST\n");

  await ensureUser(prisma, { name: "Admin DalleUp", email: "admin@dalleup.app", password: adminPassword, role: "ADMIN" });
  await ensureUser(prisma, { name: "Client Test", email: "client@test.dalleup.app", password: testPassword, role: "CLIENT" });
  await ensureUser(prisma, { name: "Restaurant Test", email: "restaurant@test.dalleup.app", password: testPassword, role: "RESTAURANT" });
  await ensureUser(prisma, {
    name: "Livreur Test",
    email: "livreur@test.dalleup.app",
    password: testPassword,
    role: "DELIVERY_DRIVER",
    vehicleType: "MOTO",
    city: "Cotonou",
    driverStatus: DriverStatus.AVAILABLE,
  });

  console.log("\n✅  SEED TERMINÉ.\n");
}

// ── CLI entry point ──────────────────────────────────────────────────────────
const isMain = process.argv[1]?.endsWith("seed-auth.ts") || process.argv[1]?.endsWith("seed-auth.js");
if (isMain) {
  loadScriptEnv();
  const prisma = new PrismaClient();

  seedAuthAccounts(prisma)
    .catch((error) => {
      console.error("\n❌  ERREUR :", error instanceof Error ? error.message : error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
