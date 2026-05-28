/**
 * Script de vérification des comptes auth.
 * Vérifie la présence et l'état des comptes de test attendus.
 *
 * Exécution :
 *   npx tsx scripts/verify-auth.ts
 */
import { PrismaClient } from "@prisma/client";
import { loadScriptEnv } from "./lib/load-env.js";

const EXPECTED_ACCOUNTS = [
  { email: "admin@dalleup.app", role: "ADMIN", required: true },
  { email: "client@test.dalleup.app", role: "CLIENT", required: true },
  { email: "restaurant@test.dalleup.app", role: "RESTAURANT", required: true },
  { email: "livreur@test.dalleup.app", role: "DELIVERY_DRIVER", required: true },
] as const;

export async function verifyAuthAccounts(prisma: PrismaClient): Promise<{ ok: boolean; missing: string[] }> {
  console.log("\n🔎  VÉRIFICATION DES COMPTES AUTH\n");

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, driverStatus: true },
    orderBy: { role: "asc" },
  });

  const totalByRole = {
    ADMIN: allUsers.filter((u) => u.role === "ADMIN").length,
    CLIENT: allUsers.filter((u) => u.role === "CLIENT").length,
    RESTAURANT: allUsers.filter((u) => u.role === "RESTAURANT").length,
    DELIVERY_DRIVER: allUsers.filter((u) => u.role === "DELIVERY_DRIVER").length,
  };

  console.log(`  Total comptes   : ${allUsers.length}`);
  console.log(`    - Admin       : ${totalByRole.ADMIN}`);
  console.log(`    - Client      : ${totalByRole.CLIENT}`);
  console.log(`    - Restaurant  : ${totalByRole.RESTAURANT}`);
  console.log(`    - Livreur     : ${totalByRole.DELIVERY_DRIVER}`);
  console.log();

  const missing: string[] = [];

  for (const expected of EXPECTED_ACCOUNTS) {
    const found = allUsers.find((u) => u.email === expected.email);

    if (!found) {
      console.log(`  ❌  ${expected.email}  [${expected.role}]  — MANQUANT`);
      if (expected.required) missing.push(expected.email);
      continue;
    }

    const roleOk = found.role === expected.role;
    const roleLabel = roleOk ? `[${found.role}]` : `[${found.role}] ⚠️  rôle attendu: ${expected.role}`;

    let extras = "";
    if (found.role === "DELIVERY_DRIVER") {
      extras = `  statut: ${found.driverStatus}`;
    }
    if (found.role === "RESTAURANT") {
      const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: found.id }, select: { status: true } });
      extras = `  restaurant: ${restaurant?.status ?? "ABSENT"}`;
    }

    console.log(`  ✅  ${found.email}  ${roleLabel}${extras}`);
    if (!roleOk) missing.push(found.email);
  }

  const ok = missing.length === 0;
  console.log(ok ? "\n✅  Tous les comptes requis sont présents.\n" : `\n⚠️  Comptes manquants ou incorrects : ${missing.join(", ")}\n`);

  return { ok, missing };
}

// ── CLI entry point ──────────────────────────────────────────────────────────
const isMain = process.argv[1]?.endsWith("verify-auth.ts") || process.argv[1]?.endsWith("verify-auth.js");
if (isMain) {
  loadScriptEnv();
  const prisma = new PrismaClient();

  verifyAuthAccounts(prisma)
    .then(({ ok }) => {
      if (!ok) process.exit(1);
    })
    .catch((error) => {
      console.error("\n❌  ERREUR :", error instanceof Error ? error.message : error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
