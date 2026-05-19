import { OrderDetailsClient } from "@/components/orders/order-details-client";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailsClient id={id} />;
}
