import { BackButton } from "@/components/layout/back-button";
import { OrderDetailsClient } from "@/components/orders/order-details-client";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <div className="px-4 pt-4"><BackButton href="/app/orders" label="Retour aux commandes" /></div>
      <OrderDetailsClient id={id} />
    </>
  );
}
