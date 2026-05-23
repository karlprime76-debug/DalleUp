import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MenuItemForm } from "@/components/restaurant/menu-item-form";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";

const nav = [{ href: "/restaurant/dashboard", label: "Accueil" }, { href: "/restaurant/orders", label: "Commandes" }, { href: "/restaurant/menu", label: "Menu" }, { href: "/restaurant/billing", label: "Facturation" }, { href: "/restaurant/settings", label: "Paramètres" }];

export default async function NewMenuItemPage() {
  await requireRole(["RESTAURANT"]);
  return <DashboardShell title="Nouveau produit" nav={nav}><Card className="mx-auto max-w-2xl p-5"><h2 className="text-xl font-black">Créer un produit</h2><p className="mb-5 mt-2 text-sm text-neutral-500">Le produit sera créé dans le catalogue du restaurant connecté.</p><MenuItemForm /></Card></DashboardShell>;
}

