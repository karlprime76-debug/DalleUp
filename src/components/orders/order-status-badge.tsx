import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  PENDING: "Reçue",
  ACCEPTED: "Acceptée",
  PREPARING: "En préparation",
  READY: "Prête",
  DRIVER_ASSIGNED: "Livreur assigné",
  PICKED_UP: "Récupérée",
  ON_THE_WAY: "En livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée"
};

export function OrderStatusBadge({ status }: { status: string }) {
  const variant = status === "DELIVERED" ? "lime" : status === "CANCELLED" ? "neutral" : status === "PENDING" ? "orange" : "soft";
  return <Badge variant={variant}>{labels[status] ?? status}</Badge>;
}
