export const driverNavSections = [
  {
    title: "Livreur",
    items: [
      { href: "/driver/dashboard", label: "Tableau de bord" },
      { href: "/driver/profile", label: "Mon profil" },
    ]
  },
  {
    title: "Livraisons",
    items: [
      { href: "/driver/deliveries/available", label: "Livraisons disponibles" },
      { href: "/driver/deliveries", label: "Mes livraisons" },
    ]
  },
  {
    title: "Finance",
    items: [
      { href: "/driver/earnings", label: "Gains & Solde" },
      { href: "/driver/wallet", label: "Portefeuille" },
    ]
  },
];

export const driverNavFlat = driverNavSections.flatMap((s) => s.items);
