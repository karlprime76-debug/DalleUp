"use client";

import { AppErrorScreen } from "@/components/layout/app-error-screen";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppErrorScreen
      error={error}
      reset={reset}
      title="Administration temporairement indisponible"
      description="Nous n'avons pas pu afficher cette section admin. Réessayez ou revenez au tableau de bord."
      homeHref="/admin/dashboard"
      homeLabel="Dashboard admin"
      secondaryHref="/admin/approvals"
      secondaryLabel="Validations"
    />
  );
}
