/**
 * Script de seed des comptes de test propres.
 *
 * Exécution :
 *   npx tsx scripts/seed-auth.ts
 *
 * Variables d'environnement requises :
 *   - ADMIN_SEED_PASSWORD   (min 8 caractères)
 *   - TEST_SEED_PASSWORD    (min 8 caractères, utilisé pour client, restaurant, livreur)
 *
 * Ne jamais hardcoder les mots de passe dans ce fichier.
 */
import { PrismaClient, DriverStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requireEnv(name: string, minLength = 1): string {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    console.error(`❌  La variable d'environnement ${name} est manquante ou trop courte (min ${minLength}).`);
    process.exit(1);
  }
  return value;
}

async function ensureUser(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "CLIENT" | "RESTAURANT" | "DELIVERY_DRIVER";
  vehicleType?: string;
  city?: string;
  driverStatus?: DriverStatus;
}) {
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

async function main() {
  const adminPassword = requireEnv("ADMIN_SEED_PASSWORD", 8);
  const testPassword = requireEnv("TEST_SEED_PASSWORD", 8);

  console.log("\n🌱  CRÉATION DES COMPTES DE TEST\n");

  await ensureUser({
    name: "Admin DalleUp",
    email: "admin@dalleup.app",
    password: adminPassword,
    role: "ADMIN",
  });

  await ensureUser({
    name: "Client Test",
    email: "client@test.dalleup.app",
    password: testPassword,
    role: "CLIENT",
  });

  await ensureUser({
    name: "Restaurant Test",
    email: "restaurant@test.dalleup.app",
    password: testPassword,
    role: "RESTAURANT",
  });

  await ensureUser({
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

main()
  .catch((error) => {
    console.error("\n❌  ERREUR :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
