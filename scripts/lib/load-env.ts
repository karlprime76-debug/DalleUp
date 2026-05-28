import { existsSync } from "node:fs";

export function loadScriptEnv(): void {
  if (!process.env.DATABASE_URL && existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
    console.log("  ✔  Variables chargées depuis .env.local");
  } else if (process.env.DATABASE_URL) {
    console.log("  ✔  Variables déjà disponibles dans l'environnement");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL est manquant. Vérifiez .env.local ou les variables Vercel.\n" +
      "Ne jamais afficher la valeur de DATABASE_URL dans les logs."
    );
  }
}
