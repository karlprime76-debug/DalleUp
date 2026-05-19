import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MenuItemForm } from "@/components/restaurant/menu-item-form";
import { Card } from "@/components/ui/card";

const nav = [{ href: "/restaurant/dashboard", label: "Accueil" }, { href: "/restaurant/orders", label: "Commandes" }, { href: "/restaurant/menu", label: "Menu" }, { href: "/restaurant/billing", label: "Facturation" }, { href: "/restaurant/settings", label: "Paramètres" }];

export default function NewMenuItemPage() {
  return <DashboardShell title="Nouveau Plat" nav={nav}><Card className="mx-auto max-w-2xl p-5"><h2 className="text-xl font-black">Créer un plat</h2><p className="mb-5 mt-2 text-sm text-neutral-500">Le plat sera créé dans le restaurant Prisma du compte connecté.</p><MenuItemForm /></Card></DashboardShell>;
}

