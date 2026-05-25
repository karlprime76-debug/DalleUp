import { prisma } from "@/lib/db/prisma";
import { drivers as mockDrivers, orders as mockOrders, restaurants as mockRestaurants, stats as mockStats } from "@/lib/mock-data";

export type OpsOrder = {
  dbId?: string;
  id: string;
  restaurant: string;
  customer: string;
  status: string;
  total: number;
  driver: string;
  driverId?: string;
  deliveryStatus?: string;
  address: string;
  note?: string | null;
  createdAt: string;
  items: { name: string; quantity: number; total: number }[];
};

export type OpsRestaurant = {
  id: string;
  dbId?: string;
  ownerId?: string;
  name: string;
  owner: string;
  phone: string;
  address: string;
  status: string;
  rating: number;
  orders: number;
  menuItems: number;
  isMock?: boolean;
};

export type OpsDriver = {
  id: string;
  dbId?: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  deliveries: number;
  earnings: number;
  isMock?: boolean;
};

export type OpsUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  driverStatus: string;
  createdAt: string;
};

export type OpsStats = {
  revenue: number;
  orders: number;
  restaurants: number;
  drivers: number;
  commission: number;
};

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp ops fallback] ${source}`, error);
}

function mockOpsOrders(): OpsOrder[] {
  return mockOrders.map((order) => ({ ...order, dbId: undefined, items: [] }));
}

export async function getOpsOrders(scope?: { restaurantOwnerId?: string; driverId?: string; page?: number; limit?: number }): Promise<OpsOrder[]> {
  try {
    const page = Math.max(1, scope?.page ?? 1);
    const limit = Math.min(100, Math.max(1, scope?.limit ?? 20));
    const orders = await prisma.order.findMany({
      where: scope?.restaurantOwnerId ? { restaurant: { ownerId: scope.restaurantOwnerId } } : scope?.driverId ? { delivery: { driverId: scope.driverId } } : undefined,
      include: { customer: true, restaurant: true, address: true, delivery: { include: { driver: true } }, items: { include: { menuItem: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    if (!orders.length) return scope?.restaurantOwnerId || scope?.driverId ? [] : mockOpsOrders();
    return orders.map((order) => ({
      dbId: order.id,
      id: order.orderNumber,
      restaurant: order.restaurant.name,
      customer: order.customer.name,
      status: order.status,
      total: order.total,
      driver: order.delivery?.driver?.name ?? "Non assigné",
      driverId: order.delivery?.driverId ?? undefined,
      deliveryStatus: order.delivery?.status ?? undefined,
      address: order.address ? `${order.address.street}, ${order.address.city}` : "Adresse client",
      note: order.note,
      createdAt: order.createdAt.toLocaleString("fr-FR"),
      items: order.items.map((item) => ({ name: item.menuItem.name, quantity: item.quantity, total: item.total }))
    }));
  } catch (error) {
    warnFallback("getOpsOrders", error);
    return scope?.restaurantOwnerId || scope?.driverId ? [] : mockOpsOrders();
  }
}

export async function getOpsRestaurants(page?: number, limit?: number): Promise<OpsRestaurant[]> {
  try {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
    const restaurants = await prisma.restaurant.findMany({ include: { owner: true, _count: { select: { orders: true, menuItems: true } } }, orderBy: { createdAt: "desc" }, skip: (safePage - 1) * safeLimit, take: safeLimit });
    if (!restaurants.length) return mockRestaurants.map((restaurant) => ({ id: restaurant.id, name: restaurant.name, owner: "Démo DalleUp", phone: "—", address: "Cotonou", status: "APPROVED", rating: restaurant.rating, orders: mockOrders.filter((order) => order.restaurant === restaurant.name).length, menuItems: 0, isMock: true }));
    return restaurants.map((restaurant) => ({ id: restaurant.slug, dbId: restaurant.id, ownerId: restaurant.ownerId, name: restaurant.name, owner: restaurant.owner.name, phone: restaurant.phone ?? "—", address: restaurant.address, status: restaurant.status, rating: restaurant.rating, orders: restaurant._count.orders, menuItems: restaurant._count.menuItems }));
  } catch (error) {
    warnFallback("getOpsRestaurants", error);
    return mockRestaurants.map((restaurant) => ({ id: restaurant.id, name: restaurant.name, owner: "Démo DalleUp", phone: "—", address: "Cotonou", status: "APPROVED", rating: restaurant.rating, orders: mockOrders.filter((order) => order.restaurant === restaurant.name).length, menuItems: 0, isMock: true }));
  }
}

export async function getOpsDrivers(page?: number, limit?: number): Promise<OpsDriver[]> {
  try {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
    const drivers = await prisma.user.findMany({ where: { role: "DELIVERY_DRIVER" }, include: { _count: { select: { deliveries: true } } }, skip: (safePage - 1) * safeLimit, take: safeLimit });
    if (!drivers.length) return mockDrivers.map((driver) => ({ ...driver, email: "demo@dalleup.test", phone: "—", isMock: true }));
    return drivers.map((driver) => ({ id: driver.id, dbId: driver.id, name: driver.name, email: driver.email, phone: driver.phone ?? "—", status: driver.driverStatus ?? "PENDING", deliveries: driver._count.deliveries, earnings: driver._count.deliveries * 2500 }));
  } catch (error) {
    warnFallback("getOpsDrivers", error);
    return mockDrivers.map((driver) => ({ ...driver, email: "demo@dalleup.test", phone: "—", isMock: true }));
  }
}

export async function getOpsUsers(page?: number, limit?: number): Promise<OpsUser[]> {
  try {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 40));
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, skip: (safePage - 1) * safeLimit, take: safeLimit });
    if (!users.length) return [
      { id: "demo-admin", name: "Admin DalleUp", email: "admin@dalleup.test", phone: "—", role: "ADMIN", driverStatus: "—", createdAt: "Démo" },
      { id: "demo-client", name: "Client DalleUp", email: "client@dalleup.test", phone: "—", role: "CLIENT", driverStatus: "—", createdAt: "Démo" }
    ];
    return users.map((user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone ?? "—", role: user.role, driverStatus: user.driverStatus ?? "—", createdAt: user.createdAt.toLocaleDateString("fr-FR") }));
  } catch (error) {
    warnFallback("getOpsUsers", error);
    return [
      { id: "demo-admin", name: "Admin DalleUp", email: "admin@dalleup.test", phone: "—", role: "ADMIN", driverStatus: "—", createdAt: "Démo" },
      { id: "demo-client", name: "Client DalleUp", email: "client@dalleup.test", phone: "—", role: "CLIENT", driverStatus: "—", createdAt: "Démo" }
    ];
  }
}

export async function getOpsStats(): Promise<OpsStats> {
  try {
    const [ordersCount, restaurantsCount, driversCount, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.restaurant.count(),
      prisma.user.count({ where: { role: "DELIVERY_DRIVER" } }),
      prisma.order.aggregate({ _sum: { total: true } })
    ]);
    if (!ordersCount && !restaurantsCount) return mockStats;
    const totalRevenue = revenue._sum.total ?? 0;
    return { revenue: totalRevenue, orders: ordersCount, restaurants: restaurantsCount, drivers: driversCount, commission: Math.round(totalRevenue * 0.15) };
  } catch (error) {
    warnFallback("getOpsStats", error);
    return mockStats;
  }
}
