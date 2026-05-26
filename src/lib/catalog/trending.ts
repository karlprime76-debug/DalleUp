import { prisma } from "@/lib/db/prisma";
import { mapMenuItem, type AppMenuItem } from "@/lib/data/mappers";

const TRENDING_LIMIT = 8;
const MIN_TRENDING_COUNT = 4;

function warnFallback(source: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") console.warn(`[DalleUp trending] ${source}`, error);
}

export async function getTrendingMenuItems(): Promise<AppMenuItem[]> {
  try {
    const orderBased = await getOrderBasedTrending();
    if (orderBased.length >= MIN_TRENDING_COUNT) return orderBased;

    const extended = await getOrderBasedTrending(30);
    const combined = mergeUnique(orderBased, extended);
    if (combined.length >= MIN_TRENDING_COUNT) return combined.slice(0, TRENDING_LIMIT);

    const fallback = await getFallbackTrendingMenuItems();
    return mergeUnique(combined, fallback).slice(0, TRENDING_LIMIT);
  } catch (error) {
    warnFallback("getTrendingMenuItems failed", error);
    return getFallbackTrendingMenuItems();
  }
}

async function getOrderBasedTrending(days = 7): Promise<AppMenuItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      menuItem: { isActive: true, restaurant: { status: "APPROVED" } }
    },
    select: { menuItemId: true }
  });

  const counts = new Map<string, number>();
  for (const oi of orderItems) {
    if (!oi.menuItemId) continue;
    counts.set(oi.menuItemId, (counts.get(oi.menuItemId) || 0) + 1);
  }

  const sortedIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  if (sortedIds.length === 0) return [];

  const items = await prisma.menuItem.findMany({
    where: { id: { in: sortedIds }, isActive: true, restaurant: { status: "APPROVED" } },
    include: { restaurant: true, category: true }
  });

  const itemMap = new Map(items.map((i) => [i.id, i]));
  return sortedIds
    .map((id) => itemMap.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map(mapMenuItem);
}

export async function getFallbackTrendingMenuItems(): Promise<AppMenuItem[]> {
  try {
    const items = await prisma.menuItem.findMany({
      where: { isActive: true, restaurant: { status: "APPROVED" } },
      include: { restaurant: true, category: true },
      orderBy: { createdAt: "desc" },
      take: TRENDING_LIMIT
    });
    if (!items.length) return [];
    return items.map(mapMenuItem);
  } catch (error) {
    warnFallback("getFallbackTrendingMenuItems failed", error);
    return [];
  }
}

function mergeUnique<T extends { id: string }>(a: T[], b: T[]): T[] {
  const seen = new Set(a.map((x) => x.id));
  const result = [...a];
  for (const item of b) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}
