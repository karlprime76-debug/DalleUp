import { DriverShell } from "@/components/layout/driver-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireApprovedDriver } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { driverNavSections } from "@/lib/navigation/driver-nav";
import { formatPrice } from "@/lib/pricing/delivery";

export default async function DriverEarningsPage() {
  const { session } = await requireApprovedDriver();

  const [wallet, deliveries] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id }, include: { entries: { orderBy: { createdAt: "desc" }, take: 50 } } }).catch(() => null),
    prisma.delivery.findMany({
      where: { driverId: session.user.id },
      include: { order: { select: { deliveryFee: true, total: true } } },
    }).catch(() => [] as unknown as Array<{
      id: string;
      status: string;
      deliveredAt: Date | null;
      order: { deliveryFee: number; total: number } | null;
    }>),
  ]);

  const completed = deliveries.filter((d) => d.status === "DELIVERED");
  const grossFees = completed.reduce((sum, d) => sum + (d.order?.deliveryFee ?? 0), 0);
  const commission = Math.round(grossFees * 0.1);
  const net = grossFees - commission;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayGains = completed.filter((d) => d.deliveredAt && new Date(d.deliveredAt) >= today).reduce((sum, d) => sum + (d.order?.deliveryFee ?? 0), 0);
  const weekGains = completed.filter((d) => d.deliveredAt && new Date(d.deliveredAt) >= weekAgo).reduce((sum, d) => sum + (d.order?.deliveryFee ?? 0), 0);

  return (
    <DriverShell title="Gains & Solde" sections={driverNavSections}>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Solde disponible</p><h2 className="mt-2 text-3xl font-black text-dalle-orange">{formatPrice(wallet?.balance ?? 0)}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Solde en attente</p><h2 className="mt-2 text-3xl font-black">{formatPrice(wallet?.pendingBalance ?? 0)}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Gains aujourd&apos;hui</p><h2 className="mt-2 text-3xl font-black text-dalle-lime">{formatPrice(todayGains)}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Gains 7 jours</p><h2 className="mt-2 text-3xl font-black text-dalle-lime">{formatPrice(weekGains)}</h2></Card>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Frais livraison bruts</p><h2 className="mt-2 text-2xl font-black">{formatPrice(grossFees)}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Commission DalleUp (10%)</p><h2 className="mt-2 text-2xl font-black">{formatPrice(commission)}</h2></Card>
        <Card className="p-5"><p className="text-sm font-bold text-neutral-500">Net livreur</p><h2 className="mt-2 text-2xl font-black text-dalle-lime">{formatPrice(net)}</h2></Card>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="text-xl font-black">Historique des transactions</h2>
        {wallet?.entries.length ? (
          <div className="mt-4 grid gap-3">
            {wallet.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4 text-sm">
                <div>
                  <p className="font-bold">{entry.type === "DRIVER_PAYOUT" ? "Commission livraison" : entry.type}</p>
                  <p className="text-neutral-500">{new Date(entry.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black ${entry.direction === "CREDIT" ? "text-dalle-lime" : "text-red-600"}`}>
                    {entry.direction === "CREDIT" ? "+" : "-"}{formatPrice(entry.amount)}
                  </p>
                  <p className="text-xs text-neutral-500">{entry.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5"><EmptyState title="Aucune transaction" description="Vos gains apparaîtront ici après vos livraisons." /></div>
        )}
      </Card>
    </DriverShell>
  );
}
