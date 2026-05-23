import { BackButton } from "@/components/layout/back-button";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export default function CheckoutPage() {
  return (
    <>
      <div className="px-4 pt-4"><BackButton href="/app/cart" label="Retour au panier" /></div>
      <CheckoutPageClient />
    </>
  );
}
