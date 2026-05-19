import { BillingInterval, InvoiceStatus, PrismaClient, SubscriptionStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const restaurantSeeds = [
  { slug: "braise-club", name: "Braise Club", category: "Grillades", description: "Poulet braisé, ribs, allocos et sauces maison.", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80", rating: 4.8, deliveryFee: 1000, minDelayMin: 25, maxDelayMin: 35, isPopular: true },
  { slug: "pizza-vibe", name: "Pizza Vibe", category: "Pizza", description: "Pizzas généreuses, pâte moelleuse et toppings premium.", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80", rating: 4.7, deliveryFee: 900, minDelayMin: 20, maxDelayMin: 30, isPopular: true },
  { slug: "benin-bowl", name: "Bénin Bowl", category: "Plats béninois", description: "Saveurs locales revisitées : amiwo, riz gras, sauces et poissons.", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80", rating: 4.9, deliveryFee: 1200, minDelayMin: 30, maxDelayMin: 45, isPopular: true },
  { slug: "burger-lab", name: "Burger Lab", category: "Burgers", description: "Burgers smashés, frites croustillantes et sauces signature.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80", rating: 4.6, deliveryFee: 1000, minDelayMin: 20, maxDelayMin: 35, isPopular: false },
  { slug: "fresh-riz", name: "Fresh Riz", category: "Riz", description: "Riz cantonais, riz au gras, bowls rapides et frais.", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80", rating: 4.5, deliveryFee: 800, minDelayMin: 25, maxDelayMin: 40, isPopular: false }
];

const menuSeeds = [
  ["braise-club", "Grillades", "Poulet braisé XL", "Poulet entier, alloço, salade, sauce verte.", 6500, "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80"],
  ["braise-club", "Grillades", "Brochettes bœuf", "4 brochettes épicées avec accompagnement.", 3500, "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80"],
  ["braise-club", "Boissons", "Citronnade maison", "Boisson fraîche citron gingembre.", 1200, "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80"],
  ["braise-club", "Grillades", "Ribs fumés", "Ribs caramélisés, frites maison.", 8000, "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80"],
  ["pizza-vibe", "Pizza", "Pizza Pepperoni", "Mozzarella, pepperoni, sauce tomate.", 5000, "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80"],
  ["pizza-vibe", "Pizza", "Pizza Chicken BBQ", "Poulet, oignons, cheddar, sauce BBQ.", 5800, "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80"],
  ["pizza-vibe", "Desserts", "Brownie fondant", "Chocolat intense et noix.", 1800, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80"],
  ["pizza-vibe", "Pizza", "Pizza veggie", "Légumes grillés, olives, mozzarella.", 4700, "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80"],
  ["benin-bowl", "Plats béninois", "Amiwo poulet", "Amiwo rouge, poulet frit, sauce tomate.", 4200, "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80"],
  ["benin-bowl", "Plats béninois", "Poisson braisé", "Poisson entier, piment, alloço.", 7000, "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=900&q=80"],
  ["benin-bowl", "Riz", "Riz gras signature", "Riz parfumé, légumes, viande au choix.", 3800, "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=80"],
  ["benin-bowl", "Boissons", "Bissap glacé", "Bissap frais légèrement sucré.", 1000, "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80"],
  ["burger-lab", "Burgers", "Smash Burger", "Double steak, cheddar, pickles, sauce lab.", 4500, "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80"],
  ["burger-lab", "Burgers", "Chicken Crispy", "Poulet croustillant, coleslaw, sauce spicy.", 4300, "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=80"],
  ["burger-lab", "Boissons", "Milkshake vanille", "Vanille crémeuse et chantilly.", 2200, "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80"],
  ["burger-lab", "Desserts", "Cookie géant", "Cookie chocolat encore tiède.", 1600, "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80"],
  ["fresh-riz", "Riz", "Riz cantonais crevettes", "Riz sauté, œuf, légumes, crevettes.", 4600, "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80"],
  ["fresh-riz", "Riz", "Bowl poulet teriyaki", "Riz, poulet glacé, légumes croquants.", 5200, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80"],
  ["fresh-riz", "Desserts", "Salade de fruits", "Fruits frais de saison.", 1500, "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80"],
  ["fresh-riz", "Boissons", "Thé glacé pêche", "Boisson légère et fruitée.", 1300, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80"]
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const admin = await prisma.user.upsert({ where: { email: "admin@dalleup.test" }, update: { passwordHash }, create: { name: "Admin Demo", email: "admin@dalleup.test", role: UserRole.ADMIN, passwordHash } });
  const client = await prisma.user.upsert({ where: { email: "client@dalleup.test" }, update: { passwordHash }, create: { name: "Client Demo", email: "client@dalleup.test", role: UserRole.CLIENT, passwordHash } });
  const owner = await prisma.user.upsert({ where: { email: "restaurant@dalleup.test" }, update: { passwordHash }, create: { name: "Restaurant Demo", email: "restaurant@dalleup.test", role: UserRole.RESTAURANT, passwordHash } });
  const driver = await prisma.user.upsert({ where: { email: "driver@dalleup.test" }, update: { passwordHash, driverStatus: "AVAILABLE" }, create: { name: "Livreur Demo", email: "driver@dalleup.test", role: UserRole.DELIVERY_DRIVER, driverStatus: "AVAILABLE", passwordHash } });
  await prisma.user.createMany({ data: ["aicha", "mickael", "grace"].map((name) => ({ name, email: `${name}@dalleup.test`, role: UserRole.CLIENT, passwordHash })), skipDuplicates: true });

  const categoryNames = ["Pizza", "Grillades", "Burgers", "Riz", "Plats béninois", "Boissons", "Desserts"];
  for (const name of categoryNames) await prisma.restaurantCategory.upsert({ where: { name }, update: {}, create: { name } });

  const restaurantBySlug = new Map<string, { id: string }>();
  for (const seed of restaurantSeeds) {
    const category = await prisma.restaurantCategory.findUniqueOrThrow({ where: { name: seed.category } });
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: seed.slug },
      update: { categoryId: category.id, name: seed.name, description: seed.description, image: seed.image, address: "Cotonou", status: "APPROVED", rating: seed.rating, deliveryFee: seed.deliveryFee, minDelayMin: seed.minDelayMin, maxDelayMin: seed.maxDelayMin, isPopular: seed.isPopular },
      create: { ownerId: owner.id, categoryId: category.id, name: seed.name, slug: seed.slug, description: seed.description, image: seed.image, address: "Cotonou", status: "APPROVED", rating: seed.rating, deliveryFee: seed.deliveryFee, minDelayMin: seed.minDelayMin, maxDelayMin: seed.maxDelayMin, isPopular: seed.isPopular }
    });
    restaurantBySlug.set(seed.slug, restaurant);
  }

  for (const restaurant of restaurantBySlug.values()) await prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } });
  for (const [slug, categoryName, name, description, price, image] of menuSeeds) {
    const restaurant = restaurantBySlug.get(slug);
    if (!restaurant) continue;
    const menuCategory = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: categoryName } });
    await prisma.menuItem.create({ data: { restaurantId: restaurant.id, categoryId: menuCategory.id, name, description, price, image, isActive: true } });
  }

  const address = await prisma.address.create({ data: { userId: client.id, label: "Maison", street: "Cadjèhoun", city: "Cotonou", zone: "Centre", isDefault: true } });
  const braiseClub = restaurantBySlug.get("braise-club");
  if (braiseClub) {
    const order = await prisma.order.upsert({ where: { orderNumber: "DU-1001" }, update: {}, create: { orderNumber: "DU-1001", customerId: client.id, restaurantId: braiseClub.id, addressId: address.id, status: "PREPARING", subtotal: 6500, deliveryFee: 1200, total: 7700 } });
    await prisma.payment.upsert({ where: { orderId: order.id }, update: {}, create: { orderId: order.id, method: "CASH_ON_DELIVERY", status: "PENDING", amount: 7700 } });
  }
  const starterPlan = await prisma.billingPlan.upsert({ where: { name: "Starter" }, update: { monthlyFee: 0, commissionRate: 15, interval: BillingInterval.MONTHLY, isActive: true }, create: { name: "Starter", description: "Plan de démarrage avec commission standard.", monthlyFee: 0, commissionRate: 15, interval: BillingInterval.MONTHLY } });
  const premiumPlan = await prisma.billingPlan.upsert({ where: { name: "Premium" }, update: { monthlyFee: 15000, commissionRate: 12, interval: BillingInterval.MONTHLY, isActive: true }, create: { name: "Premium", description: "Plan premium avec commission réduite.", monthlyFee: 15000, commissionRate: 12, interval: BillingInterval.MONTHLY } });
  for (const [slug, restaurant] of restaurantBySlug.entries()) {
    const seed = restaurantSeeds.find((item) => item.slug === slug);
    const plan = seed?.isPopular ? premiumPlan : starterPlan;
    const subscription = await prisma.restaurantSubscription.findFirst({ where: { restaurantId: restaurant.id } });
    const activeSubscription = subscription ?? await prisma.restaurantSubscription.create({ data: { restaurantId: restaurant.id, planId: plan.id, status: SubscriptionStatus.ACTIVE } });
    await prisma.invoice.upsert({ where: { number: `INV-${slug}-001` }, update: {}, create: { restaurantId: restaurant.id, subscriptionId: activeSubscription.id, number: `INV-${slug}-001`, status: InvoiceStatus.OPEN, amount: plan.monthlyFee, commission: 0 } });
  }
  await prisma.platformSetting.upsert({ where: { key: "default_delivery_fee" }, update: { value: "1200" }, create: { key: "default_delivery_fee", value: "1200" } });
  void admin;
  void driver;
}

main().finally(async () => prisma.$disconnect());
