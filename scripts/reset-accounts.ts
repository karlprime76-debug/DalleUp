/**
 * Script de reset sécurisé des comptes utilisateurs.
 *
 * Exécution :
 *   RESET_ACCOUNTS_CONFIRM="YES_DELETE_TEST_ACCOUNTS" npx tsx scripts/reset-accounts.ts
 *
 * ⚠️ NE PAS exécuter en production sans avoir d'abord lu le résumé.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONFIRM_KEY = "YES_DELETE_TEST_ACCOUNTS";

async function main() {
  const confirm = process.env.RESET_ACCOUNTS_CONFIRM;

  if (confirm !== CONFIRM_KEY) {
    console.error("\n❌  VARIABLE D'ENVIRONNEMENT MANQUANT");
    console.error(`\nPour exécuter ce script, lancez :`);
    console.error(`  RESET_ACCOUNTS_CONFIRM="${CONFIRM_KEY}" npx tsx scripts/reset-accounts.ts\n`);
    process.exit(1);
  }

  console.log("🔍  RAPPORT DE DONNÉES AVANT SUPPRESSION\n");

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
    console.log("\n✅  Aucun utilisateur à supprimer.");
    return;
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
  console.log(`    - Sessions NextAuth       : ${sessions}`);
  console.log(`    - Accounts OAuth          : ${accounts}`);
  console.log(`    - VerificationTokens      : ${verificationTokens}`);

  console.log("\n⚠️  ACTION : Tous les utilisateurs, leurs sessions, accounts, tokens, restaurants, commandes, livraisons, adresses, favoris, wallets, payouts, reviews, notifications et logs d'audit seront supprimés.");
  console.log("    Les fichiers images sur Supabase Storage ne seront PAS supprimés.");
  console.log("\n⏳  Démarrage de la suppression dans 5 secondes (Ctrl+C pour annuler)...\n");

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Suppression dans l'ordre pour respecter les foreign keys
  await prisma.$transaction(async (tx) => {
    // 1. Tokens
    await tx.verificationToken.deleteMany({});
    // 2. Sessions
    await tx.session.deleteMany({});
    // 3. Accounts
    await tx.account.deleteMany({});
    // 4. Données liées aux users
    await tx.pushSubscription.deleteMany({});
    await tx.favorite.deleteMany({});
    await tx.address.deleteMany({});
    await tx.wallet.deleteMany({});
    await tx.payout.deleteMany({});
    await tx.billingNotification.deleteMany({});
    await tx.notification.deleteMany({});
    await tx.adminAuditLog.deleteMany({});
    await tx.review.deleteMany({});
    // 5. Order items
    await tx.orderItem.deleteMany({});
    // 6. Payments
    await tx.payment.deleteMany({});
    // 7. Deliveries
    await tx.delivery.deleteMany({});
    // 8. Orders
    await tx.order.deleteMany({});
    // 9. Invoices & subscriptions
    await tx.invoice.deleteMany({});
    await tx.restaurantSubscription.deleteMany({});
    // 10. Menu items
    await tx.menuItem.deleteMany({});
    // 11. Restaurants
    await tx.restaurant.deleteMany({});
    // 12. Platform settings (garder !)
    // 13. Users
    await tx.user.deleteMany({});
  });

  console.log("\n✅  TOUS LES COMPTES ET DONNÉES LIÉES ONT ÉTÉ SUPPRIMÉS.\n");
}

main()
  .catch((error) => {
    console.error("\n❌  ERREUR :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
