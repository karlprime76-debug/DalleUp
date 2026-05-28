/**
 * Script automatisé : reset + seed + vérification.
 *
 * Exécution recommandée via PowerShell :
 *   powershell -ExecutionPolicy Bypass -File scripts/auth-reset-local.ps1
 *
 * Ou manuellement :
 *   $env:RESET_ACCOUNTS_CONFIRM="YES_DELETE_TEST_ACCOUNTS"
 *   $env:ADMIN_SEED_PASSWORD="..."
 *   $env:TEST_SEED_PASSWORD="..."
 *   npx tsx scripts/reset-and-seed-auth.ts
 *
 * ⚠️  NE PAS exécuter en production sans backup Supabase préalable.
 */
import { PrismaClient } from "@prisma/client";
import { loadScriptEnv } from "./lib/load-env.js";
import { CONFIRM_KEY, resetAccounts } from "./reset-accounts.js";
import { seedAuthAccounts, requireSeedEnv } from "./seed-auth.js";
import { verifyAuthAccounts } from "./verify-auth.js";

async function main() {
  console.log("\n════════════════════════════════════════");
  console.log("  RESET AUTH DALLEUP");
  console.log("════════════════════════════════════════\n");

  // 1. Charger les variables d'environnement
  loadScriptEnv();
  console.log("  Base ciblée : DATABASE_URL détecté, valeur masquée\n");

  // 2. Vérifier les confirmations avant toute action
  if (process.env.RESET_ACCOUNTS_CONFIRM !== CONFIRM_KEY) {
    console.error(`❌  RESET_ACCOUNTS_CONFIRM doit être égal à "${CONFIRM_KEY}"`);
    process.exit(1);
  }
  try {
    requireSeedEnv("ADMIN_SEED_PASSWORD", 8);
    requireSeedEnv("TEST_SEED_PASSWORD", 8);
  } catch (err) {
    console.error("❌ ", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // 3. Reset
    const { deleted } = await resetAccounts(prisma);
    console.log(`  ✔  Comptes supprimés : ${deleted}`);

    // 4. Seed
    await seedAuthAccounts(prisma);
    console.log("  ✔  Comptes recréés");

    // 5. Vérification
    const { ok, missing } = await verifyAuthAccounts(prisma);
    console.log(`  ✔  Vérification terminée — ${ok ? "OK" : `⚠️ manquants: ${missing.join(", ")}`}`);

    // 6. Rapport final
    console.log("\n════════════════════════════════════════");
    console.log("  RAPPORT FINAL");
    console.log("════════════════════════════════════════");
    console.log(`  Comptes supprimés  : ${deleted}`);
    console.log(`  Comptes recréés    : 4 (admin, client, restaurant, livreur)`);
    console.log(`  Vérification       : ${ok ? "✅ PASSÉ" : "❌ ÉCHOUÉ"}`);
    console.log("════════════════════════════════════════\n");

    if (!ok) process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\n❌  ERREUR FATALE :", error instanceof Error ? error.message : error);
  process.exit(1);
});
