export const adminNavSections = [
  {
    title: "Vue d'ensemble",
    items: [
      { href: "/admin", label: "Tableau de bord" },
    ]
  },
  {
    title: "Opérations",
    items: [
      { href: "/admin/orders", label: "Commandes" },
      { href: "/admin/restaurants", label: "Restaurants" },
      { href: "/admin/drivers", label: "Livreurs" },
      { href: "/admin/users", label: "Utilisateurs" },
      { href: "/admin/approvals", label: "Validations" },
    ]
  },
  {
    title: "Catalogue & Marketing",
    items: [
      { href: "/admin/places", label: "Lieux & Repères" },
      { href: "/admin/promotions", label: "Promotions" },
      { href: "/admin/sponsoring", label: "Sponsoring" },
      { href: "/admin/reviews", label: "Avis clients" },
    ]
  },
  {
    title: "Finances",
    items: [
      { href: "/admin/payments", label: "Paiements" },
      { href: "/admin/payments/report", label: "Rapports paiements" },
      { href: "/admin/payouts", label: "Reversements" },
    ]
  },
  {
    title: "Conformité & Audit",
    items: [
      { href: "/admin/audit", label: "Audit" },
      { href: "/admin/compliance", label: "Conformité" },
    ]
  },
  {
    title: "Système",
    items: [
      { href: "/admin/notifications", label: "Notifications" },
      { href: "/admin/settings", label: "Paramètres" },
    ]
  },
];

export const adminNavFlat = adminNavSections.flatMap((s) => s.items);
