"use client";

import { AppErrorScreen } from "@/components/layout/app-error-screen";

export default function DriverError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppErrorScreen
      error={error}
      reset={reset}
      title="Espace livreur temporairement indisponible"
      description="Nous n'avons pas pu afficher cette section livreur. Réessayez ou revenez au tableau de bord."
      homeHref="/driver/dashboard"
      homeLabel="Dashboard"
      secondaryHref="/driver/deliveries"
      secondaryLabel="Mes livraisons"
    />
  );
}
