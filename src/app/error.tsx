"use client";

import { AppErrorScreen } from "@/components/layout/app-error-screen";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AppErrorScreen error={error} reset={reset} />;
}
