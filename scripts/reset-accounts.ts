/**
 * Script de reset sécurisé des comptes utilisateurs.
 *
 * Exécution directe :
 *   npx tsx scripts/reset-accounts.ts
 *   (requiert RESET_ACCOUNTS_CONFIRM=YES_DELETE_TEST_ACCOUNTS dans l'environnement)
 *
 * Ou via PowerShell :
 *   powershell -ExecutionPolicy Bypass -File scripts/auth-reset-local.ps1
 *
 * ⚠️ NE PAS exécuter en production sans backup préalable.
 */
import { PrismaClient } from "@prisma/client";
import { loadScriptEnv } from "./lib/load-env.js";

export const CONFIRM_KEY = "YES_DELETE_TEST_ACCOUNTS";

export async function resetAccounts(prisma: PrismaClient, opts?: { skipDelay?: boolean }): Promise<{ deleted: number }> {
  console.log("\n🔍  RAPPORT DE DONNÉES AVANT SUPPRESSION\n");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, driverStatus: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const admins = users.filter((u) => u.role === "ADMIN");
  const restaurants = users.filter((u) => u.role === "RESTAURANT");
  const drivers = users.filter((u) => u.role === "DELIVERY_DRIVER");
  const clients = users.filter((u) => u.role === "CLIENT");

  console.log(`  Total utilisateurs : ${users.length}`);
  console.log(`    - Admins         : ${admins.length}`);
  console.log(`    - Restaurants    : ${restaurants.length}`);
  console.log(`    - Livreurs       : ${drivers.length}`);
  console.log(`    - Clients        : ${clients.length}`);

  if (users.length === 0) {
    console.log("\n✅  Aucun utilisateur à supprimer.\n");
    return { deleted: 0 };
  }

  console.log("\n📋  LISTE DES COMPTES :\n");
  for (const u of users) {
    const extra = u.role === "DELIVERY_DRIVER" ? ` (${u.driverStatus})` : "";
    console.log(`    [${u.role}] ${u.email} — ${u.name}${extra} — créé le ${u.createdAt.toISOString()}`);
  }

  const sessions = await prisma.session.count();
  const accounts = await prisma.account.count();
  const verificationTokens = await prisma.verificationToken.count();

  console.log(`\n📊  AUTRES DONNÉES LIÉES :`);
  console.log(`    - Sessions NextAuth  : ${sessions}`);
  console.log(`    - Accounts OAuth     : ${accounts}`);
  console.log(`    - VerificationTokens : ${verificationTokens}`);

  console.log("\n⚠️  ACTION : Tous les utilisateurs, sessions, tokens, restaurants, commandes, livraisons,");
  console.log("    adresses, wallets, reviews, notifications et logs seront supprimés.");
  console.log("    Les fichiers images sur Supabase Storage ne seront PAS supprimés.");
  console.log("    Les PlatformSettings seront conservés.");

  if (!opts?.skipDelay) {
    console.log("\n⏳  Démarrage dans 5 secondes (Ctrl+C pour annuler)...\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  await prisma.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({});
    await tx.session.deleteMany({});
    await tx.account.deleteMany({});
    await tx.pushSubscription.deleteMany({});
    await tx.favorite.deleteMany({});
    await tx.address.deleteMany({});
    await tx.wallet.deleteMany({});
    await tx.payout.deleteMany({});
    await tx.billingNotification.deleteMany({});
    await tx.notification.deleteMany({});
    await tx.adminAuditLog.deleteMany({});
    await tx.review.deleteMany({});
    await tx.orderItem.deleteMany({});
    await tx.payment.deleteMany({});
    await tx.delivery.deleteMany({});
    await tx.order.deleteMany({});
    await tx.invoice.deleteMany({});
    await tx.restaurantSubscription.deleteMany({});
    await tx.menuItem.deleteMany({});
    await tx.restaurant.deleteMany({});
    await tx.user.deleteMany({});
  });

  console.log(`\n✅  ${users.length} compte(s) et toutes les données liées supprimés.\n`);
  return { deleted: users.length };
}

// ── CLI entry point ──────────────────────────────────────────────────────────
const isMain = process.argv[1]?.endsWith("reset-accounts.ts") || process.argv[1]?.endsWith("reset-accounts.js");
if (isMain) {
  loadScriptEnv();
  const prisma = new PrismaClient();

  if (process.env.RESET_ACCOUNTS_CONFIRM !== CONFIRM_KEY) {
    console.error("\n❌  CONFIRMATION MANQUANTE");
    console.error(`\n  Lancez avec : $env:RESET_ACCOUNTS_CONFIRM="${CONFIRM_KEY}"`);
    console.error(`  Puis        : npx tsx scripts/reset-accounts.ts\n`);
    process.exit(1);
  }

  resetAccounts(prisma)
    .catch((error) => {
      console.error("\n❌  ERREUR :", error instanceof Error ? error.message : error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
