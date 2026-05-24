"use client";

import { AppErrorScreen } from "@/components/layout/app-error-screen";

export default function RestaurantError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppErrorScreen
      error={error}
      reset={reset}
      title="Espace restaurant temporairement indisponible"
      description="Votre espace restaurant rencontre un problème technique. Réessayez ou retournez au tableau de bord."
      homeHref="/restaurant/dashboard"
      homeLabel="Dashboard"
      secondaryHref="/restaurant/onboarding"
      secondaryLabel="Profil restaurant"
    />
  );
}
