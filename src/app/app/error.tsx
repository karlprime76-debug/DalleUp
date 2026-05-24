"use client";

import { AppErrorScreen } from "@/components/layout/app-error-screen";

export default function CustomerAppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppErrorScreen
      error={error}
      reset={reset}
      title="Espace client temporairement indisponible"
      description="Nous n'avons pas pu afficher cette section client. Réessayez ou revenez à l'accueil."
      homeHref="/app"
      homeLabel="Accueil client"
      secondaryHref="/app/orders"
      secondaryLabel="Mes commandes"
    />
  );
}
