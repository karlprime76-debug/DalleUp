export const productCategoryOptions = ["Plat", "Boisson", "Jus", "Dessert", "Accompagnement", "Sauce", "Supplément", "Combo", "Alcool", "Autre"] as const;

export type ProductType = "FOOD" | "DRINK" | "JUICE" | "DESSERT" | "SIDE" | "SAUCE" | "EXTRA" | "COMBO" | "ALCOHOL" | "OTHER";

export const productFilters = ["Tous", "Plats", "Boissons", "Jus", "Desserts", "Extras", "Alcools"] as const;

const categoryMap: Record<string, ProductType> = {
  plat: "FOOD",
  plats: "FOOD",
  food: "FOOD",
  boisson: "DRINK",
  boissons: "DRINK",
  drink: "DRINK",
  drinks: "DRINK",
  jus: "JUICE",
  juice: "JUICE",
  dessert: "DESSERT",
  desserts: "DESSERT",
  accompagnement: "SIDE",
  accompagnements: "SIDE",
  side: "SIDE",
  sides: "SIDE",
  sauce: "SAUCE",
  sauces: "SAUCE",
  supplément: "EXTRA",
  suppléments: "EXTRA",
  supplement: "EXTRA",
  supplements: "EXTRA",
  extra: "EXTRA",
  extras: "EXTRA",
  combo: "COMBO",
  combos: "COMBO",
  menu: "COMBO",
  menus: "COMBO",
  alcool: "ALCOHOL",
  alcools: "ALCOHOL",
  alcohol: "ALCOHOL"
};

export function getProductTypeFromCategory(category?: string | null): ProductType {
  const normalized = String(category ?? "").trim().toLowerCase();
  return categoryMap[normalized] ?? "OTHER";
}

export function isAlcoholCategory(category?: string | null) {
  return getProductTypeFromCategory(category) === "ALCOHOL";
}

export function isComplementCategory(category?: string | null) {
  return ["DRINK", "JUICE", "DESSERT", "SIDE", "SAUCE", "EXTRA"].includes(getProductTypeFromCategory(category));
}

export function getDisplayCategory(category?: string | null) {
  const type = getProductTypeFromCategory(category);
  if (type === "FOOD") return "Plats";
  if (type === "DRINK") return "Boissons";
  if (type === "JUICE") return "Jus";
  if (type === "DESSERT") return "Desserts";
  if (type === "SIDE") return "Accompagnements";
  if (type === "SAUCE") return "Sauces";
  if (type === "EXTRA") return "Suppléments";
  if (type === "COMBO") return "Menus combo";
  if (type === "ALCOHOL") return "Alcools";
  return category?.trim() || "Autres";
}
