import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

for (const file of [".env", ".env.local", ".env.production", ".env.production.local"]) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const full = process.argv.includes("--full");
const prisma = new PrismaClient();

const requiredEnv = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "APP_URL",
  "RESEND_API_KEY",
  "MAIL_FROM",
  "PAYDUNYA_MASTER_KEY",
  "PAYDUNYA_PRIVATE_KEY",
  "PAYDUNYA_TOKEN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY"
] as const;

const optionalEnv = ["NEXT_PUBLIC_APP_URL", "PAYDUNYA_PUBLIC_KEY", "PAYDUNYA_STORE_NAME", "PAYDUNYA_MODE"] as const;

type Check = { label: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function add(label: string, ok: boolean, detail?: string) {
  checks.push({ label, ok, detail });
}

function run(label: string, command: string, args: string[]) {
  const result = process.platform === "win32"
    ? spawnSync("cmd.exe", ["/c", command, ...args], { stdio: "pipe", shell: false, encoding: "utf8" })
    : spawnSync(command, args, { stdio: "pipe", shell: false, encoding: "utf8" });
  add(label, result.status === 0, result.status === 0 ? undefined : (result.error?.message || result.stderr || result.stdout || "Commande échouée.").trim());
}

function localBin(name: string) {
  return join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? `${name}.cmd` : name);
}

async function main() {
  add("package.json présent", existsSync("package.json"));
  add("schema Prisma présent", existsSync("prisma/schema.prisma"));
  add("seed Prisma présent", existsSync("prisma/seed.ts"));

  for (const key of requiredEnv) add(`ENV ${key}`, Boolean(process.env[key]), process.env[key] ? undefined : "Manquant");
  for (const key of optionalEnv) add(`ENV optionnelle ${key}`, true, process.env[key] ? "Défini" : "Non défini");

  if (process.env.PAYDUNYA_MODE && !["sandbox", "production"].includes(process.env.PAYDUNYA_MODE)) {
    add("PAYDUNYA_MODE valide", false, "Valeurs attendues: sandbox ou production");
  } else {
    add("PAYDUNYA_MODE valide", true, process.env.PAYDUNYA_MODE || "sandbox par défaut");
  }

  run("Prisma generate", localBin("prisma"), ["generate"]);

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$connect();
      add("Connexion base de données", true);
      const [users, restaurants, menuItems, billingPlans] = await Promise.all([
        prisma.user.count(),
        prisma.restaurant.count(),
        prisma.menuItem.count(),
        prisma.billingPlan.count()
      ]);
      add("Seed utilisateurs", users > 0, `${users} utilisateur(s)`);
      add("Seed restaurants", restaurants > 0, `${restaurants} restaurant(s)`);
      add("Seed menus", menuItems > 0, `${menuItems} plat(s)`);
      add("Seed plans billing", billingPlans > 0, `${billingPlans} plan(s)`);
    } catch (error) {
      add("Connexion base de données", false, error instanceof Error ? error.message : "Erreur inconnue");
    }
  }

  run("Lint", localBin("eslint"), []);
  if (full) run("Build production", localBin("next"), ["build"]);

  const failed = checks.filter((check) => !check.ok);
  console.log("\nAudit lancement DalleUp\n");
  for (const check of checks) {
    const icon = check.ok ? "OK" : "FAIL";
    console.log(`${icon} - ${check.label}${check.detail ? `: ${check.detail}` : ""}`);
  }

  if (failed.length) {
    console.error(`\n${failed.length} point(s) à corriger avant lancement.`);
    process.exitCode = 1;
  } else {
    console.log("\nTous les contrôles critiques sont OK.");
  }
}

main().finally(async () => prisma.$disconnect());
