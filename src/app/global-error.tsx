"use client";

import "./globals.css";
import { AppErrorScreen } from "@/components/layout/app-error-screen";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body>
        <AppErrorScreen error={error} reset={reset} title="Service temporairement indisponible" />
      </body>
    </html>
  );
}
