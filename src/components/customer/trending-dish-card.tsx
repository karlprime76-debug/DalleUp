"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Flame, Plus, Store } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart/cart-store";
import { formatPrice } from "@/lib/pricing/delivery";

type TrendingDishCardProps = {
  item: {
    id: string;
    restaurantId: string;
    restaurantName?: string;
    category?: string;
    name: string;
    description: string;
    price: number;
    image: string;
    active: boolean;
  };
  rank?: number;
};

export function TrendingDishCard({ item, rank }: TrendingDishCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!item.active) return;
    addItem({
      id: item.id,
      restaurantId: item.restaurantId,
      restaurantName: item.restaurantName ?? "Restaurant",
      name: item.name,
      description: item.description,
      image: item.image,
      category: item.category,
      price: item.price
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  const href = `/app/restaurants/${item.restaurantId}?item=${item.id}`;

  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-[1.75rem] bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
      aria-label={`${item.name} chez ${item.restaurantName ?? "Restaurant"} — ${formatPrice(item.price)}`}
    >
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="112px"
        />
        {rank !== undefined && rank < 3 ? (
          <span className="absolute left-2 top-2 rounded-full bg-dalle-orange px-2 py-0.5 text-[10px] font-black text-white">
            #{rank + 1}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant="soft"><Flame size={13} />Tendance</Badge>
          {item.category ? <Badge variant="neutral">{item.category}</Badge> : null}
        </div>
        <h3 className="font-black text-dalle-charcoal">{item.name}</h3>
        {item.restaurantName ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-neutral-500">
            <Store size={12} />
            {item.restaurantName}
          </p>
        ) : null}
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{item.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-black text-dalle-orange">{formatPrice(item.price)}</span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!item.active}
            className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-2xl bg-dalle-charcoal px-3 text-sm font-black text-white transition hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {added ? <Check size={18} /> : <Plus size={18} />}
            {!item.active ? "Indisponible" : added ? "Ajouté" : "Ajouter"}
          </button>
        </div>
      </div>
    </Link>
  );
}
