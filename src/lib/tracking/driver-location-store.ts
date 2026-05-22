/**
 * Store temporaire en mémoire pour les positions livreur.
 * LIMITATION : les données ne survivent pas au redémarrage du serveur.
 * En production serverless (Vercel), chaque fonction a sa propre mémoire.
 * Solution future : migrer vers Prisma (Delivery.currentLatitude/currentLongitude)
 * ou Supabase PostgreSQL + Realtime.
 */

type DriverLocation = {
  driverId: string;
  orderId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

const store = new Map<string, DriverLocation>(); // key = orderId

export function setDriverLocation(location: DriverLocation) {
  store.set(location.orderId, location);
}

export function getDriverLocation(orderId: string): DriverLocation | undefined {
  return store.get(orderId);
}

export function removeDriverLocation(orderId: string) {
  store.delete(orderId);
}
