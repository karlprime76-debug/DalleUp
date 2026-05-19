export const categories = ["Pizza", "Grillades", "Burgers", "Riz", "Plats béninois", "Boissons", "Desserts"];

export const restaurants = [
  {
    id: "braise-club",
    name: "Braise Club",
    category: "Grillades",
    rating: 4.8,
    delay: "25-35 min",
    deliveryFee: 1000,
    popular: true,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
    description: "Poulet braisé, ribs, allocos et sauces maison pour les grosses faims."
  },
  {
    id: "pizza-vibe",
    name: "Pizza Vibe",
    category: "Pizza",
    rating: 4.7,
    delay: "20-30 min",
    deliveryFee: 900,
    popular: true,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    description: "Pizzas généreuses, pâte moelleuse et toppings premium."
  },
  {
    id: "benin-bowl",
    name: "Bénin Bowl",
    category: "Plats béninois",
    rating: 4.9,
    delay: "30-45 min",
    deliveryFee: 1200,
    popular: true,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    description: "Saveurs locales revisitées : amiwo, riz gras, sauces et poissons."
  },
  {
    id: "burger-lab",
    name: "Burger Lab",
    category: "Burgers",
    rating: 4.6,
    delay: "20-35 min",
    deliveryFee: 1000,
    popular: false,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    description: "Burgers smashés, frites croustillantes et sauces signature."
  },
  {
    id: "fresh-riz",
    name: "Fresh Riz",
    category: "Riz",
    rating: 4.5,
    delay: "25-40 min",
    deliveryFee: 800,
    popular: false,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    description: "Riz cantonais, riz au gras, bowls rapides et frais."
  }
];

export const menuItems = [
  { id: "m1", restaurantId: "braise-club", category: "Grillades", name: "Poulet braisé XL", description: "Poulet entier, alloço, salade, sauce verte.", price: 6500, active: true, image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80" },
  { id: "m2", restaurantId: "braise-club", category: "Grillades", name: "Brochettes bœuf", description: "4 brochettes épicées avec accompagnement.", price: 3500, active: true, image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80" },
  { id: "m3", restaurantId: "braise-club", category: "Boissons", name: "Citronnade maison", description: "Boisson fraîche citron gingembre.", price: 1200, active: true, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80" },
  { id: "m4", restaurantId: "pizza-vibe", category: "Pizza", name: "Pizza Pepperoni", description: "Mozzarella, pepperoni, sauce tomate.", price: 5000, active: true, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80" },
  { id: "m5", restaurantId: "pizza-vibe", category: "Pizza", name: "Pizza Chicken BBQ", description: "Poulet, oignons, cheddar, sauce BBQ.", price: 5800, active: true, image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80" },
  { id: "m6", restaurantId: "pizza-vibe", category: "Desserts", name: "Brownie fondant", description: "Chocolat intense et noix.", price: 1800, active: true, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80" },
  { id: "m7", restaurantId: "benin-bowl", category: "Plats béninois", name: "Amiwo poulet", description: "Amiwo rouge, poulet frit, sauce tomate.", price: 4200, active: true, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80" },
  { id: "m8", restaurantId: "benin-bowl", category: "Plats béninois", name: "Poisson braisé", description: "Poisson entier, piment, alloço.", price: 7000, active: true, image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=900&q=80" },
  { id: "m9", restaurantId: "benin-bowl", category: "Riz", name: "Riz gras signature", description: "Riz parfumé, légumes, viande au choix.", price: 3800, active: true, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=80" },
  { id: "m10", restaurantId: "burger-lab", category: "Burgers", name: "Smash Burger", description: "Double steak, cheddar, pickles, sauce lab.", price: 4500, active: true, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80" },
  { id: "m11", restaurantId: "burger-lab", category: "Burgers", name: "Chicken Crispy", description: "Poulet croustillant, coleslaw, sauce spicy.", price: 4300, active: true, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=80" },
  { id: "m12", restaurantId: "burger-lab", category: "Boissons", name: "Milkshake vanille", description: "Vanille crémeuse et chantilly.", price: 2200, active: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80" },
  { id: "m13", restaurantId: "fresh-riz", category: "Riz", name: "Riz cantonais crevettes", description: "Riz sauté, œuf, légumes, crevettes.", price: 4600, active: true, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80" },
  { id: "m14", restaurantId: "fresh-riz", category: "Riz", name: "Bowl poulet teriyaki", description: "Riz, poulet glacé, légumes croquants.", price: 5200, active: true, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80" },
  { id: "m15", restaurantId: "fresh-riz", category: "Desserts", name: "Salade de fruits", description: "Fruits frais de saison.", price: 1500, active: true, image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80" },
  { id: "m16", restaurantId: "braise-club", category: "Grillades", name: "Ribs fumés", description: "Ribs caramélisés, frites maison.", price: 8000, active: false, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80" },
  { id: "m17", restaurantId: "pizza-vibe", category: "Pizza", name: "Pizza veggie", description: "Légumes grillés, olives, mozzarella.", price: 4700, active: true, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80" },
  { id: "m18", restaurantId: "benin-bowl", category: "Boissons", name: "Bissap glacé", description: "Bissap frais légèrement sucré.", price: 1000, active: true, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80" },
  { id: "m19", restaurantId: "burger-lab", category: "Desserts", name: "Cookie géant", description: "Cookie chocolat encore tiède.", price: 1600, active: true, image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80" },
  { id: "m20", restaurantId: "fresh-riz", category: "Boissons", name: "Thé glacé pêche", description: "Boisson légère et fruitée.", price: 1300, active: true, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80" }
];

export const orders = [
  { id: "DU-1001", customer: "Aïcha", restaurant: "Braise Club", status: "PREPARING", total: 7700, driver: "Kevin", address: "Cadjèhoun, Cotonou", createdAt: "Aujourd’hui 12:40" },
  { id: "DU-1002", customer: "Mickaël", restaurant: "Pizza Vibe", status: "ON_THE_WAY", total: 6800, driver: "Sarah", address: "Haie Vive, Cotonou", createdAt: "Aujourd’hui 12:55" },
  { id: "DU-1003", customer: "Grâce", restaurant: "Bénin Bowl", status: "DELIVERED", total: 5400, driver: "Kevin", address: "Calavi centre", createdAt: "Hier 20:18" },
  { id: "DU-1004", customer: "Junior", restaurant: "Burger Lab", status: "PENDING", total: 5700, driver: "Non assigné", address: "Fidjrossè", createdAt: "Aujourd’hui 13:05" }
];

export const drivers = [
  { id: "d1", name: "Kevin Tossou", status: "AVAILABLE", deliveries: 18, earnings: 42000 },
  { id: "d2", name: "Sarah Mensah", status: "ON_DELIVERY", deliveries: 22, earnings: 51000 }
];

export const customers = [
  { id: "c1", name: "Aïcha", email: "aicha@dalleup.test" },
  { id: "c2", name: "Mickaël", email: "mickael@dalleup.test" },
  { id: "c3", name: "Grâce", email: "grace@dalleup.test" }
];

export const stats = {
  revenue: 1265000,
  orders: 342,
  restaurants: restaurants.length,
  drivers: drivers.length,
  commission: 189750
};
