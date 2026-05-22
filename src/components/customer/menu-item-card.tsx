"use client";

import Image from "next/image";
import { Check, Flame, Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart/cart-store";
import { formatPrice } from "@/lib/pricing/delivery";

type MenuItemCardProps = {
  item: { id?: string; restaurantId?: string; restaurantName?: string; category?: string; productType?: string; isAlcohol?: boolean; name: string; description: string; price: number; image: string; active: boolean };
  popular?: boolean;
  restaurantName?: string;
};

export function MenuItemCard({ item, popular, restaurantName }: MenuItemCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      id: item.id ?? item.name,
      restaurantId: item.restaurantId ?? "unknown",
      restaurantName: item.restaurantName ?? restaurantName ?? "Restaurant DalleUp",
      name: item.name,
      description: item.description,
      image: item.image,
      category: item.category,
      productType: item.productType,
      isAlcohol: item.isAlcohol,
      price: item.price
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="flex gap-4 rounded-[1.75rem] bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl">
        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="112px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap gap-2">
          {popular ? <Badge variant="soft"><Flame size={13} />Tendance</Badge> : null}
          {item.category ? <Badge variant="neutral">{item.category}</Badge> : null}
          {item.isAlcohol ? <Badge variant="dark"><ShieldAlert size={13} />18+</Badge> : null}
          {!item.active ? <Badge variant="neutral">Indisponible pour le moment</Badge> : null}
        </div>
        <h3 className="font-black text-dalle-charcoal">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{item.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-black text-dalle-orange">{formatPrice(item.price)}</span>
          <button type="button" onClick={handleAdd} disabled={!item.active || item.isAlcohol} className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-2xl bg-dalle-charcoal px-3 text-sm font-black text-white transition disabled:bg-neutral-200 disabled:text-neutral-400">
            {added ? <Check size={18} /> : <Plus size={18} />}{item.isAlcohol ? "18+" : !item.active ? "Indisponible" : added ? "Ajouté" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
