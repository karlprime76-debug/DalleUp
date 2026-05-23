import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MenuItemForm } from "@/components/restaurant/menu-item-form";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { getRestaurantMenuItemForOwner } from "@/lib/data/restaurant-menu";

const nav = [{ href: "/restaurant/dashboard", label: "Accueil" }, { href: "/restaurant/orders", label: "Commandes" }, { href: "/restaurant/menu", label: "Menu" }, { href: "/restaurant/billing", label: "Facturation" }, { href: "/restaurant/settings", label: "Paramètres" }];

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["RESTAURANT"]);
  const { id } = await params;
  const item = await getRestaurantMenuItemForOwner(session.user.id, id);
  if (!item) redirect("/restaurant/menu");
  return <DashboardShell title="Éditer produit" nav={nav}><Card className="mx-auto max-w-2xl p-5"><h2 className="text-xl font-black">{item.name}</h2><p className="mb-5 mt-2 text-sm text-neutral-500">{item.isMock ? "Fallback mock en lecture seule." : "Modifier les informations du produit."}</p><MenuItemForm item={{ id: item.dbId ?? item.id, name: item.name, description: item.description, price: item.price, image: item.image, category: item.category, isActive: item.isActive, isMock: item.isMock }} /></Card></DashboardShell>;
}

