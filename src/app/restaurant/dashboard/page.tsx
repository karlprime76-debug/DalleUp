import Link from "next/link";
import { CookingPot, ReceiptText, Store, Wallet } from "lucide-react";
import { RestaurantShell } from "@/components/layout/restaurant-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusActions } from "@/components/ops/order-status-actions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { getOpsOrders } from "@/lib/data/ops";
import { getRestaurantMenuForOwner } from "@/lib/data/restaurant-menu";
import { prisma } from "@/lib/db/prisma";
import { restaurantNavSections } from "@/lib/navigation/restaurant-nav";
import { formatPrice } from "@/lib/pricing/delivery";

const restaurantDashboardSelect = {
  id: true,
  name: true,
  description: true,
  image: true,
  address: true,
  phone: true,
  status: true,
} as const;

function isRestaurantProfileComplete(restaurant: { name: string; description: string; address: string; phone?: string | null }) {
  return Boolean(
    restaurant.name &&
    restaurant.description &&
    restaurant.description !== "En attente de configuration" &&
    restaurant.address &&
    restaurant.address !== "Non renseigné" &&
    restaurant.phone
  );
}

export default async function RestaurantDashboardPage() {
  const session = await requireRole(["RESTAURANT"]);
  if (process.env.NODE_ENV !== "production") {
    console.log("[dashboard] user id:", session.user.id, "role:", session.user.role);
  }
  let restaurant: Awaited<ReturnType<typeof prisma.restaurant.findFirst<{ where: { ownerId: string }; select: typeof restaurantDashboardSelect }>>>;
  try {
    restaurant = await prisma.restaurant.findFirst({ where: { ownerId: session.user.id }, select: restaurantDashboardSelect });
  } catch (error) {
    console.error("[restaurant dashboard] restaurant lookup failed", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return (
      <RestaurantShell title="Tableau de bord indisponible" sections={restaurantNavSections}>
        <Card className="p-8">
          <h1 className="text-2xl font-black">Impossible de charger votre restaurant</h1>
          <p className="mt-3 text-neutral-600">Une erreur technique empêche l&apos;affichage du tableau de bord pour le moment.</p>
          <ButtonLink href="/restaurant/onboarding" className="mt-5">Vérifier mon profil</ButtonLink>
        </Card>
      </RestaurantShell>
    );
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("[dashboard] restaurant found:", Boolean(restaurant), "restaurant id:", restaurant?.id ?? "none", "status:", restaurant?.status ?? "none");
  }

  if (!restaurant) {
    return (
      <RestaurantShell title="Configurer votre restaurant" sections={restaurantNavSections}>
        <Card className="p-8">
          <h1 className="text-2xl font-black">Configurez votre restaurant</h1>
          <p className="mt-3 text-neutral-600">Votre compte restaurant existe, mais aucun profil restaurant n&apos;est encore lié à votre utilisateur.</p>
          <ButtonLink href="/restaurant/onboarding" className="mt-5">Commencer</ButtonLink>
        </Card>
      </RestaurantShell>
    );
  }

  const isComplete = isRestaurantProfileComplete(restaurant);

  if (!isComplete) {
    const checklist = [
      { label: "Nom restaurant", done: Boolean(restaurant.name) },
      { label: "Téléphone", done: Boolean(restaurant.phone) },
      { label: "Adresse", done: Boolean(restaurant.address && restaurant.address !== "Non renseigné") },
      { label: "Description", done: Boolean(restaurant.description && restaurant.description !== "En attente de configuration") },
      { label: "Photo/logo plus tard", done: Boolean(restaurant.image) },
    ];

    return (
      <RestaurantShell title="Compléter votre restaurant" sections={restaurantNavSections}>
        <Card className="p-8">
          <h1 className="text-2xl font-black">Complétez votre profil restaurant</h1>
          <p className="mt-3 text-neutral-600">Votre espace restaurant est actif, mais quelques informations sont nécessaires avant validation.</p>
          <div className="mt-5 grid gap-2">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-bold">
                <span>{item.label}</span>
                <span className={item.done ? "text-dalle-lime" : "text-dalle-orange"}>{item.done ? "OK" : "À compléter"}</span>
              </div>
            ))}
          </div>
          <ButtonLink href="/restaurant/onboarding" className="mt-5">Compléter mon profil</ButtonLink>
        </Card>
      </RestaurantShell>
    );
  }

  const [orders, menu] = await Promise.all([getOpsOrders({ restaurantOwnerId: session.user.id }), getRestaurantMenuForOwner(session.user.id)]);
  const activeOrders = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const hasProducts = menu.items.length > 0;
  const activeProducts = menu.items.filter((item) => item.isActive).length;
  const setupChecklist = [
    { label: "Profil restaurant complété", done: isComplete, href: "/restaurant/onboarding" },
    { label: "Photo de couverture ajoutée", done: Boolean(restaurant.image), href: "/restaurant/onboarding" },
    { label: "Au moins 3 produits créés", done: menu.items.length >= 3, href: "/restaurant/menu/new" },
    { label: "Produits disponibles à la vente", done: activeProducts > 0, href: "/restaurant/menu" },
    { label: "Validation admin obtenue", done: restaurant.status === "APPROVED", href: "/restaurant/pending" },
  ];
  const completedSteps = setupChecklist.filter((item) => item.done).length;

  return (
    <RestaurantShell title="Tableau de bord" sections={restaurantNavSections}>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-black text-dalle-orange">Mise en ligne</p>
            <h2 className="text-2xl font-black text-dalle-charcoal">Préparez votre restaurant</h2>
            <p className="mt-1 text-sm text-neutral-500">{completedSteps}/{setupChecklist.length} étapes complétées avant une expérience client complète.</p>
          </div>
          <Badge variant={restaurant.status === "APPROVED" && activeProducts > 0 ? "lime" : "orange"}>{restaurant.status === "APPROVED" && activeProducts > 0 ? "Visible côté client" : "À finaliser"}</Badge>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {setupChecklist.map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-bold transition hover:bg-neutral-100">
              <span>{item.label}</span>
              <span className={item.done ? "text-dalle-lime" : "text-dalle-orange"}>{item.done ? "OK" : "À faire"}</span>
            </Link>
          ))}
        </div>
      </Card>
      {/* Alertes */}
      {restaurant.status === "PENDING" && (
        <Card className="mb-5 border-dashed border-dalle-orange/30 bg-orange-50/50 p-5">
          <p className="font-black text-dalle-orange">Votre restaurant est en attente de validation.</p>
          <p className="mt-2 text-sm text-neutral-600">Vous pouvez préparer votre profil et votre menu pendant que l&apos;admin vérifie votre demande.</p>
        </Card>
      )}
      {!hasProducts && (
        <Card className="mb-5 border-dashed border-dalle-orange/30 bg-orange-50/50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-dalle-orange">Votre menu est vide</p>
              <p className="text-sm text-neutral-600">Ajoutez vos premiers produits pour apparaître dans la recherche client.</p>
            </div>
            <ButtonLink href="/restaurant/menu/new" variant="dark" size="sm">Ajouter un produit</ButtonLink>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Restaurant</p>
          <h2 className="mt-2 text-2xl font-black">{menu.restaurant?.name ?? "Restaurant"}</h2>
          <Badge variant={restaurant.status === "APPROVED" ? "lime" : "neutral"} className="mt-2">{restaurant.status === "APPROVED" ? "Actif" : "En attente"}</Badge>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Commandes actives</p>
          <h2 className="mt-2 text-3xl font-black text-dalle-orange">{activeOrders.length}</h2>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Commandes livrées</p>
          <h2 className="mt-2 text-3xl font-black text-dalle-lime">{deliveredOrders.length}</h2>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Chiffre d&apos;affaires</p>
          <h2 className="mt-2 text-3xl font-black text-dalle-orange">{formatPrice(revenue)}</h2>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/restaurant/profile" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-neutral-50"><Store size={20} className="text-dalle-orange" /><span className="font-bold">Modifier mon profil</span></Link>
        <Link href="/restaurant/menu/new" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-neutral-50"><CookingPot size={20} className="text-dalle-orange" /><span className="font-bold">Ajouter un produit</span></Link>
        <Link href="/restaurant/orders" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-neutral-50"><ReceiptText size={20} className="text-dalle-orange" /><span className="font-bold">Voir les commandes</span></Link>
        <Link href="/restaurant/finance" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-neutral-50"><Wallet size={20} className="text-dalle-orange" /><span className="font-bold">Mon solde</span></Link>
      </div>

      {/* Commandes actives */}
      <Card className="mt-5 p-5">
        <h2 className="text-xl font-black">Commandes à suivre</h2>
        {activeOrders.length ? (
          <div className="mt-4 grid gap-3">
            {activeOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[120px_1fr_150px_1fr]">
                <b>{order.id}</b>
                <div>
                  <p>{order.customer} · {order.address}</p>
                  {order.note ? <p className="mt-1 text-sm font-bold text-neutral-600">{order.note}</p> : null}
                  {order.items.length ? <p className="mt-1 text-sm text-neutral-500">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}</p> : null}
                </div>
                <OrderStatusBadge status={order.status} />
                <OrderStatusActions orderId={order.dbId} role="restaurant" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5"><EmptyState title="Aucune commande active" description="Les nouvelles commandes à préparer apparaîtront ici." /></div>
        )}
      </Card>
    </RestaurantShell>
  );
}
