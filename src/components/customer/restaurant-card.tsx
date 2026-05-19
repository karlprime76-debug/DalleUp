import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/pricing/delivery";

export function RestaurantCard({ restaurant, hrefPrefix = "/app/restaurants" }: { restaurant: { id: string; name: string; category: string; rating: number; delay: string; deliveryFee: number; popular: boolean; image: string; description: string }; hrefPrefix?: string }) {
  return (
    <Link href={`${hrefPrefix}/${restaurant.id}`} className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44">
        <Image src={restaurant.image} alt={restaurant.name} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        {restaurant.popular ? <span className="absolute left-4 top-4 rounded-full bg-dalle-lime px-3 py-1 text-xs font-black text-dalle-charcoal">Populaire</span> : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-dalle-charcoal">{restaurant.name}</h3>
            <p className="text-sm text-neutral-500">{restaurant.category}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-sm font-black text-dalle-orange"><Star size={14} fill="currentColor" />{restaurant.rating}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-neutral-500">{restaurant.description}</p>
        <div className="mt-4 flex items-center justify-between text-sm font-bold text-neutral-600">
          <span>{restaurant.delay}</span>
          <span>{formatPrice(restaurant.deliveryFee)}</span>
        </div>
      </div>
    </Link>
  );
}
