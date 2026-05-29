import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/pricing/delivery";

export function RestaurantCard({ restaurant, hrefPrefix = "/app/restaurants" }: { restaurant: { id: string; name: string; category: string; status?: string; isOpen?: boolean; rating: number; delay: string; deliveryFee: number; popular: boolean; image: string; description: string; currentPlanCode?: string | null; isSponsored?: boolean; isFeatured?: boolean; priorityScore?: number }; hrefPrefix?: string }) {
  const planBadge = restaurant.isSponsored
    ? { text: "Sponsorisé", className: "bg-dalle-orange text-white" }
    : restaurant.currentPlanCode === "PREMIUM"
      ? { text: "Premium", className: "bg-dalle-lime text-dalle-charcoal" }
      : restaurant.currentPlanCode === "ENTERPRISE"
        ? { text: "Partenaire", className: "bg-dalle-charcoal text-white" }
        : null;
  return (
    <Link href={`${hrefPrefix}/${restaurant.id}`} className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44">
        {restaurant.image ? (
          <Image src={restaurant.image} alt={restaurant.name} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-orange-50">
            <span className="text-3xl font-black text-dalle-orange">{restaurant.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        {planBadge ? <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-black ${planBadge.className}`}>{planBadge.text}</span> : null}
        {restaurant.rating >= 4.5 && !planBadge ? <span className="absolute left-4 top-4 rounded-full bg-dalle-lime px-3 py-1 text-xs font-black text-dalle-charcoal">Populaire</span> : null}
        <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-black ${restaurant.isOpen === false ? "bg-neutral-900 text-white" : "bg-white/90 text-dalle-charcoal backdrop-blur-sm"}`}>{restaurant.isOpen === false ? "Fermé" : "Ouvert"}</span>
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
        {restaurant.isOpen === false ? <p className="mt-2 rounded-2xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-500">Ce restaurant est fermé pour le moment.</p> : null}
        <div className="mt-4 flex items-center justify-between text-sm font-bold text-neutral-600">
          <span>{restaurant.delay}</span>
          <span>{formatPrice(restaurant.deliveryFee)}</span>
        </div>
      </div>
    </Link>
  );
}
