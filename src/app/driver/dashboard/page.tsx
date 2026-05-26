import Link from "next/link";
import { Bike, ReceiptText, Truck, Wallet } from "lucide-react";
import { DriverAvailabilityToggle } from "@/components/driver/driver-availability-toggle";
import { DriverShell } from "@/components/layout/driver-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireApprovedDriver } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { driverNavSections } from "@/lib/navigation/driver-nav";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function DriverDashboardPage() {
  const { session, user } = await requireApprovedDriver();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [wallet, deliveries] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id }, include: { entries: { where: { createdAt: { gte: startOfDay } }, orderBy: { createdAt: "desc" } } } }).catch(() => null),
    prisma.delivery.findMany({
      where: { driverId: session.user.id },
      include: { order: { select: { total: true, deliveryFee: true, status: true } } },
    }).catch(() => [] as unknown as Array<{ id: string; order: { total: number; deliveryFee: number; status: string } | null } & { status: string; orderId: string }>),
  ]);

  const activeDeliveries = deliveries.filter((d) => !["DELIVERED", "FAILED"].includes(d.status));

  const todayEarnings = (wallet?.entries ?? []).reduce((sum, e) => sum + (e.direction === "CREDIT" ? e.amount : 0), 0);

  const isAvailable = user.driverStatus === "AVAILABLE";
  const isOnDelivery = user.driverStatus === "ON_DELIVERY";

  return (
    <DriverShell title="Tableau de bord" sections={driverNavSections}>
      {/* Alertes */}
      {user.driverStatus === "OFFLINE" && (
        <Card className="mb-5 border-dashed border-dalle-orange/30 bg-orange-50/50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-dalle-orange">Vous êtes hors ligne</p>
              <p className="text-sm text-neutral-600">Activez votre disponibilité pour recevoir des livraisons.</p>
            </div>
            <ButtonLink href="/driver/profile" variant="dark" size="sm">Modifier ma disponibilité</ButtonLink>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Statut</p>
          <h2 className="mt-2 text-2xl font-black">
            {isAvailable ? "Disponible" : isOnDelivery ? "En livraison" : "Hors ligne"}
          </h2>
          <Badge variant={isAvailable ? "lime" : isOnDelivery ? "orange" : "neutral"} className="mt-2">
            {user.driverStatus}
          </Badge>
          <div className="mt-3">
            <DriverAvailabilityToggle currentStatus={user.driverStatus} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Livraisons actives</p>
          <h2 className="mt-2 text-3xl font-black text-dalle-orange">{activeDeliveries.length}</h2>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Gains aujourd&apos;hui</p>
          <h2 className="mt-2 text-3xl font-black text-dalle-lime">{formatPrice(todayEarnings)}</h2>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">Solde disponible</p>
          <h2 className="mt-2 text-3xl font-black text-dalle-orange">{formatPrice(wallet?.balance ?? 0)}</h2>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/driver/deliveries" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-neutral-50">
          <Truck size={20} className="text-dalle-orange" /><span className="font-bold">Mes livraisons</span>
        </Link>
        <Link href="/driver/earnings" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-neutral-50">
          <Wallet size={20} className="text-dalle-orange" /><span className="font-bold">Mes gains</span>
        </Link>
        <Link href="/driver/profile" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-neutral-50">
          <Bike size={20} className="text-dalle-orange" /><span className="font-bold">Mon profil</span>
        </Link>
        <Link href="/driver/wallet" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-neutral-50">
          <ReceiptText size={20} className="text-dalle-orange" /><span className="font-bold">Mon solde</span>
        </Link>
      </div>

      {/* Livraisons actives */}
      <Card className="mt-5 p-5">
        <h2 className="text-xl font-black">Livraisons en cours</h2>
        {activeDeliveries.length ? (
          <div className="mt-4 grid gap-3">
            {activeDeliveries.slice(0, 6).map((delivery) => (
              <div key={delivery.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[120px_1fr_150px_120px]">
                <b>{delivery.orderId.slice(0, 8)}</b>
                <div>
                  <p>{delivery.order?.status}</p>
                  <p className="mt-1 text-sm text-neutral-500">{formatPrice(delivery.order?.total ?? 0)}</p>
                </div>
                <Badge variant="orange">{delivery.status}</Badge>
                <ButtonLink href={`/driver/deliveries/${delivery.orderId}`} size="sm" variant="dark">Détail</ButtonLink>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState title="Aucune livraison en cours" description="Les nouvelles livraisons apparaîtront ici quand vous serez assigné." />
          </div>
        )}
      </Card>
    </DriverShell>
  );
}
