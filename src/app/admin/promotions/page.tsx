import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/pricing/delivery";


function formatDate(date?: Date | null) {
  return date ? date.toLocaleDateString("fr-FR") : "—";
}

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { code: "asc" } }).catch(() => []);

  return (
    <AdminShell title="Promotions" sections={adminNavSections}>
      <Card className="p-5">
        <h2 className="text-xl font-black">Codes promo</h2>
        <p className="mt-2 text-sm text-neutral-500">Gestion des codes promo et offres promotionnelles.</p>
        <div className="mt-4 grid gap-3">
          {promoCodes.length === 0 ? (
            <p className="text-sm font-bold text-neutral-400">Aucun code promo configuré.</p>
          ) : (
            promoCodes.map((promo) => (
              <div key={promo.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-[1fr_140px_160px_160px]">
                <div>
                  <p className="font-black">{promo.code}</p>
                  <p className="text-sm text-neutral-500">{promo.description ?? "Promotion DalleUp"}</p>
                </div>
                <Badge variant={promo.isActive ? "lime" : "neutral"}>{promo.isActive ? "Actif" : "Inactif"}</Badge>
                <p className="text-sm font-bold text-neutral-600">{promo.discountPct ? `${promo.discountPct}%` : promo.discountAmount ? formatPrice(promo.discountAmount) : "—"}</p>
                <p className="text-sm text-neutral-500">{formatDate(promo.startsAt)} → {formatDate(promo.endsAt)}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </AdminShell>
  );
}
