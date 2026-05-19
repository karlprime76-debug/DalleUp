"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "@/lib/cart/cart-store";
import { formatPrice } from "@/lib/pricing/delivery";

export function CartPageClient() {
  const { items, subtotal, deliveryFee, total, incrementItem, decrementItem, removeItem, clearCart } = useCart();
  return (
    <main className="px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <p className="font-black text-dalle-orange">Ton panier</p>
        <h1 className="text-3xl font-black text-dalle-charcoal">Prêt à commander ?</h1>
        {items.length === 0 ? <div className="mt-6"><EmptyState title="Panier vide" description="Ajoute un plat qui te fait envie et reviens ici pour valider." actionHref="/app/restaurants" actionLabel="Voir les restaurants" /></div> : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold text-neutral-500">{items[0]?.restaurantName}</p><Button type="button" variant="outline" size="sm" onClick={clearCart}>Vider</Button></div>
              <div className="grid gap-3">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-3xl bg-neutral-50 p-4"><div><p className="font-black">{item.name}</p><p className="mt-1 text-sm text-neutral-500">{formatPrice(item.price)} · quantité {item.quantity}</p><div className="mt-3 flex items-center gap-2"><button type="button" onClick={() => decrementItem(item.id)} className="grid h-8 w-8 place-items-center rounded-xl bg-white"><Minus size={15} /></button><span className="font-black">{item.quantity}</span><button type="button" onClick={() => incrementItem(item.id)} className="grid h-8 w-8 place-items-center rounded-xl bg-dalle-charcoal text-white"><Plus size={15} /></button></div></div><div className="text-right"><p className="font-black text-dalle-orange">{formatPrice(item.price * item.quantity)}</p><button type="button" onClick={() => removeItem(item.id)} className="mt-3 text-neutral-400"><Trash2 size={18} /></button></div></div>)}</div>
            </Card>
            <Card className="h-fit p-5"><h2 className="text-xl font-black">Résumé</h2><div className="mt-4 grid gap-3 text-sm"><div className="flex justify-between"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>Frais livraison</span><span>{formatPrice(deliveryFee)}</span></div><div className="flex justify-between border-t pt-3 text-xl font-black"><span>Total</span><span>{formatPrice(total)}</span></div></div><ButtonLink href="/app/checkout" className="mt-5 w-full">Passer commande</ButtonLink></Card>
          </div>
        )}
      </div>
    </main>
  );
}
