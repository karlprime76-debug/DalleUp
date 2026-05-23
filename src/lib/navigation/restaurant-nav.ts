export const restaurantNavSections = [
  {
    title: "Restaurant",
    items: [
      { href: "/restaurant/dashboard", label: "Tableau de bord" },
      { href: "/restaurant/profile", label: "Mon profil" },
      { href: "/restaurant/settings", label: "Paramètres" },
    ]
  },
  {
    title: "Menu & Produits",
    items: [
      { href: "/restaurant/menu", label: "Mon menu" },
      { href: "/restaurant/menu/new", label: "Ajouter un produit" },
      { href: "/restaurant/categories", label: "Catégories" },
    ]
  },
  {
    title: "Commandes",
    items: [
      { href: "/restaurant/orders", label: "Commandes reçues" },
    ]
  },
  {
    title: "Finance",
    items: [
      { href: "/restaurant/finance", label: "Solde & Revenus" },
      { href: "/restaurant/billing", label: "Facturation" },
      { href: "/restaurant/wallet", label: "Portefeuille" },
    ]
  },
];

export const restaurantNavFlat = restaurantNavSections.flatMap((s) => s.items);
