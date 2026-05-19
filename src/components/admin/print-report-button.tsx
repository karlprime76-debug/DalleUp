"use client";

import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return <Button type="button" variant="dark" onClick={() => window.print()}>Imprimer / PDF</Button>;
}
