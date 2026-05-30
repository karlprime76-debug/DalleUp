"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "failed" | "error">("checking");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/payments/paydunya/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.status === "completed") {
          setStatus("paid");
          setOrderId(data.orderId ?? null);
          if (data.orderId) {
            router.push(`/app/orders/${data.orderId}`);
          }
        } else if (data.status === "failed") {
          setStatus("failed");
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("error");
      }
    }
    check();
    return () => { cancelled = true; };
  }, [token, router]);

  const title =
    status === "paid" ? "Paiement confirmé" :
    status === "failed" ? "Paiement échoué" :
    status === "pending" ? "Paiement en attente" :
    status === "error" ? "Erreur de vérification" :
    "Vérification du paiement…";

  const subtitle =
    status === "paid" ? "Votre commande a été envoyée au restaurant." :
    status === "failed" ? "Le paiement n'a pas abouti. Veuillez réessayer." :
    status === "pending" ? "Le paiement est toujours en attente de confirmation." :
    status === "error" ? "Impossible de vérifier le statut. Contactez le support." :
    "Ne fermez pas cette page. Nous vérifions votre paiement avec PayDunya.";

  return (
    <main className="min-h-screen bg-dalle-cream px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center">
          <p className="font-black text-dalle-orange">PayDunya</p>
          <h1 className="mt-2 text-3xl font-black text-dalle-charcoal">{title}</h1>
          <p className="mt-3 text-neutral-500">{subtitle}</p>
          {token ? (
            <p className="mt-3 break-all rounded-2xl bg-neutral-50 p-3 text-xs font-bold text-neutral-500">
              Token: {token}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {orderId ? (
              <ButtonLink href={`/app/orders/${orderId}`}>Voir ma commande</ButtonLink>
            ) : (
              <ButtonLink href="/app/orders">Voir mes commandes</ButtonLink>
            )}
            <ButtonLink href="/app/restaurants" variant="outline">
              Continuer mes achats
            </ButtonLink>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default function PaydunyaReturnPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-dalle-cream px-4 py-12">
        <div className="mx-auto max-w-xl">
          <Card className="p-6 text-center">
            <p className="font-black text-dalle-orange">PayDunya</p>
            <h1 className="mt-2 text-3xl font-black text-dalle-charcoal">Vérification du paiement…</h1>
          </Card>
        </div>
      </main>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}
