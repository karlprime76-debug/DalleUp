import { BillingInterval, InvoiceStatus, PrismaClient, SubscriptionStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const passwordHashPromise = bcrypt.hash("dalleup-test-1234", 10);

const restaurants = [
  {
    slug: "maquis-du-port",
    name: "Maquis du Port",
    ownerName: "Maquis du Port Owner",
    ownerEmail: "restaurant1@dalleup.test",
    category: "Plats béninois",
    description: "Classiques béninois, poissons braisés, amiwo et sauces maison à Cotonou.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    address: "Ganhi, Cotonou",
    phone: "+229 01 90 00 00 01",
    rating: 4.8,
    deliveryFee: 1000,
    minDelayMin: 25,
    maxDelayMin: 40,
    isPopular: true,
    menu: [
      ["Spécialités", "Poisson braisé complet", "Poisson entier, alloço, piment frais et salade.", 7500],
      ["Spécialités", "Amiwo poulet", "Amiwo rouge, poulet frit et sauce tomate relevée.", 4500],
      ["Spécialités", "Riz au gras bœuf", "Riz parfumé, légumes et bœuf mijoté.", 4200],
      ["Sauces", "Pâte noire sauce gombo", "Pâte de maïs noir, sauce gombo et viande.", 3800],
      ["Sauces", "Akassa sauce poisson", "Akassa frais, sauce tomate et poisson frit.", 3500],
      ["Boissons", "Bissap glacé", "Bissap maison servi frais.", 1000]
    ]
  },
  {
    slug: "braise-cotonou",
    name: "Braise Cotonou",
    ownerName: "Braise Cotonou Owner",
    ownerEmail: "restaurant2@dalleup.test",
    category: "Grillades",
    description: "Poulets braisés, brochettes, ribs et accompagnements rapides.",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80",
    address: "Cadjèhoun, Cotonou",
    phone: "+229 01 90 00 00 02",
    rating: 4.7,
    deliveryFee: 900,
    minDelayMin: 20,
    maxDelayMin: 35,
    isPopular: true,
    menu: [
      ["Grillades", "Demi poulet braisé", "Demi poulet, alloço et sauce verte.", 4000],
      ["Grillades", "Poulet entier braisé", "Poulet entier, frites, salade et sauces.", 7500],
      ["Grillades", "Brochettes de bœuf", "Quatre brochettes épicées avec accompagnement.", 3500],
      ["Grillades", "Ribs fumés", "Ribs caramélisés, frites maison et coleslaw.", 8500],
      ["Accompagnements", "Alloco portion", "Bananes plantain frites et piment.", 1500],
      ["Boissons", "Citronnade gingembre", "Citronnade maison au gingembre.", 1200]
    ]
  },
  {
    slug: "pizza-haie-vive",
    name: "Pizza Haie Vive",
    ownerName: "Pizza Haie Vive Owner",
    ownerEmail: "restaurant3@dalleup.test",
    category: "Pizza",
    description: "Pizzas généreuses, pâte moelleuse et service rapide autour de Haie Vive.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    address: "Haie Vive, Cotonou",
    phone: "+229 01 90 00 00 03",
    rating: 4.6,
    deliveryFee: 1200,
    minDelayMin: 25,
    maxDelayMin: 45,
    isPopular: true,
    menu: [
      ["Pizzas", "Pizza margherita", "Tomate, mozzarella, basilic et huile d’olive.", 4200],
      ["Pizzas", "Pizza pepperoni", "Mozzarella, pepperoni et sauce tomate.", 5500],
      ["Pizzas", "Pizza chicken BBQ", "Poulet, oignons, cheddar et sauce BBQ.", 6000],
      ["Pizzas", "Pizza végétarienne", "Légumes grillés, olives et mozzarella.", 5000],
      ["Sides", "Garlic bread", "Pain à l’ail gratiné au fromage.", 1800],
      ["Desserts", "Brownie chocolat", "Brownie fondant aux noix.", 2000]
    ]
  },
  {
    slug: "burger-akpakpa",
    name: "Burger Akpakpa",
    ownerName: "Burger Akpakpa Owner",
    ownerEmail: "restaurant4@dalleup.test",
    category: "Burgers",
    description: "Burgers smashés, frites croustillantes et sauces signature.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    address: "Akpakpa, Cotonou",
    phone: "+229 01 90 00 00 04",
    rating: 4.5,
    deliveryFee: 1000,
    minDelayMin: 20,
    maxDelayMin: 35,
    isPopular: false,
    menu: [
      ["Burgers", "Smash burger", "Double steak, cheddar, pickles et sauce maison.", 4800],
      ["Burgers", "Chicken crispy", "Poulet croustillant, coleslaw et sauce spicy.", 4500],
      ["Burgers", "Fish burger", "Filet de poisson pané, tartare et salade.", 4300],
      ["Menus", "Menu smash", "Smash burger, frites et boisson.", 6500],
      ["Sides", "Frites cheddar", "Frites croustillantes, cheddar fondu et oignons.", 2200],
      ["Desserts", "Cookie géant", "Cookie chocolat servi tiède.", 1600]
    ]
  },
  {
    slug: "fresh-bowl-calavi",
    name: "Fresh Bowl Calavi",
    ownerName: "Fresh Bowl Calavi Owner",
    ownerEmail: "restaurant5@dalleup.test",
    category: "Riz",
    description: "Bowls de riz, salades fraîches et plats rapides pour Calavi et Cotonou.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    address: "Calavi centre",
    phone: "+229 01 90 00 00 05",
    rating: 4.4,
    deliveryFee: 800,
    minDelayMin: 25,
    maxDelayMin: 40,
    isPopular: false,
    menu: [
      ["Bowls", "Bowl poulet teriyaki", "Riz, poulet glacé, crudités et graines.", 5200],
      ["Bowls", "Bowl crevettes", "Riz sauté, crevettes, légumes et sauce soja.", 5800],
      ["Riz", "Riz cantonais", "Riz sauté, œuf, légumes et jambon de bœuf.", 4200],
      ["Riz", "Riz végétarien", "Riz parfumé, légumes grillés et sauce légère.", 3500],
      ["Salades", "Salade avocat thon", "Avocat, thon, crudités et vinaigrette maison.", 3800],
      ["Boissons", "Thé glacé pêche", "Thé glacé maison légèrement sucré.", 1300]
    ]
  }
] as const;

async function upsertMenuItem(restaurantId: string, categoryId: string, item: readonly [string, string, string, number]) {
  const [, name, description, price] = item;
  const existing = await prisma.menuItem.findFirst({ where: { restaurantId, name } });
  if (existing) {
    await prisma.menuItem.update({ where: { id: existing.id }, data: { categoryId, description, price, isActive: true } });
    return;
  }
  await prisma.menuItem.create({ data: { restaurantId, categoryId, name, description, price, isActive: true } });
}

async function main() {
  const passwordHash = await passwordHashPromise;
  const categoryNames = Array.from(new Set(restaurants.map((restaurant) => restaurant.category)));

  await prisma.user.upsert({
    where: { email: "admin@dalleup.test" },
    update: { name: "Admin DalleUp", role: UserRole.ADMIN, phone: "+229 01 50 25 59 93" },
    create: { name: "Admin DalleUp", email: "admin@dalleup.test", role: UserRole.ADMIN, phone: "+229 01 50 25 59 93", passwordHash }
  });

  await prisma.user.upsert({
    where: { email: "driver@dalleup.test" },
    update: { name: "Livreur DalleUp", role: UserRole.DELIVERY_DRIVER, phone: "+229 01 90 00 00 10", driverStatus: "AVAILABLE" },
    create: { name: "Livreur DalleUp", email: "driver@dalleup.test", role: UserRole.DELIVERY_DRIVER, phone: "+229 01 90 00 00 10", driverStatus: "AVAILABLE", passwordHash }
  });

  for (const name of categoryNames) {
    await prisma.restaurantCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  const starterPlan = await prisma.billingPlan.upsert({ where: { name: "Starter" }, update: { isActive: true }, create: { name: "Starter", description: "Plan de démarrage avec commission standard.", monthlyFee: 0, commissionRate: 15, interval: BillingInterval.MONTHLY } });
  const premiumPlan = await prisma.billingPlan.upsert({ where: { name: "Premium" }, update: { isActive: true }, create: { name: "Premium", description: "Plan premium avec commission réduite.", monthlyFee: 15000, commissionRate: 12, interval: BillingInterval.MONTHLY } });

  for (const seed of restaurants) {
    const owner = await prisma.user.upsert({
      where: { email: seed.ownerEmail },
      update: { name: seed.ownerName, role: UserRole.RESTAURANT, phone: seed.phone },
      create: { name: seed.ownerName, email: seed.ownerEmail, role: UserRole.RESTAURANT, phone: seed.phone, passwordHash }
    });
    const category = await prisma.restaurantCategory.findUniqueOrThrow({ where: { name: seed.category } });
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: seed.slug },
      update: { categoryId: category.id, name: seed.name, description: seed.description, image: seed.image, address: seed.address, phone: seed.phone, status: "APPROVED", rating: seed.rating, deliveryFee: seed.deliveryFee, minDelayMin: seed.minDelayMin, maxDelayMin: seed.maxDelayMin, isPopular: seed.isPopular },
      create: { ownerId: owner.id, categoryId: category.id, name: seed.name, slug: seed.slug, description: seed.description, image: seed.image, address: seed.address, phone: seed.phone, status: "APPROVED", rating: seed.rating, deliveryFee: seed.deliveryFee, minDelayMin: seed.minDelayMin, maxDelayMin: seed.maxDelayMin, isPopular: seed.isPopular }
    });

    const menuCategoryIds = new Map<string, string>();
    for (const categoryName of Array.from(new Set(seed.menu.map((item) => item[0])))) {
      const existing = await prisma.menuCategory.findFirst({ where: { restaurantId: restaurant.id, name: categoryName } });
      const menuCategory = existing ?? await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: categoryName } });
      menuCategoryIds.set(categoryName, menuCategory.id);
    }

    for (const item of seed.menu) {
      const categoryId = menuCategoryIds.get(item[0]);
      if (categoryId) await upsertMenuItem(restaurant.id, categoryId, item);
    }

    const plan = seed.isPopular ? premiumPlan : starterPlan;
    const existingSubscription = await prisma.restaurantSubscription.findFirst({ where: { restaurantId: restaurant.id } });
    const subscription = existingSubscription ?? await prisma.restaurantSubscription.create({ data: { restaurantId: restaurant.id, planId: plan.id, status: SubscriptionStatus.ACTIVE } });
    await prisma.invoice.upsert({ where: { number: `INV-${seed.slug}-001` }, update: {}, create: { restaurantId: restaurant.id, subscriptionId: subscription.id, number: `INV-${seed.slug}-001`, status: InvoiceStatus.OPEN, amount: plan.monthlyFee, commission: 0 } });
  }

  await prisma.platformSetting.upsert({ where: { key: "default_delivery_fee" }, update: {}, create: { key: "default_delivery_fee", value: "1200" } });
}

main().finally(async () => prisma.$disconnect());
