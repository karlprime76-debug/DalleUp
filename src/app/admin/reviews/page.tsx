import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";


export default async function AdminReviewsPage() {
  await requireAdmin();
  const reviews = await prisma.review.findMany({
    include: { user: { select: { name: true } }, restaurant: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  }).catch(() => []);

  return (
    <AdminShell title="Avis clients" sections={adminNavSections}>
      <Card className="p-5">
        <h2 className="text-xl font-black">Avis récents</h2>
        <p className="mt-2 text-sm text-neutral-500">Les avis sont liés aux commandes livrées. Le modèle actuel ne permet pas de noter séparément le livreur ni le service : cette fonctionnalité nécessitera une migration future.</p>
        <div className="mt-4 grid gap-3">
          {reviews.length === 0 ? (
            <p className="text-sm font-bold text-neutral-400">Aucun avis pour le moment.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="grid gap-3 rounded-2xl bg-neutral-50 p-4 md:grid-cols-[140px_1fr_1fr_180px]">
                <div><Badge variant={review.rating >= 4 ? "lime" : review.rating === 3 ? "orange" : "neutral"}>{review.rating}/5</Badge><p className="mt-2 text-xs font-bold text-neutral-500">{review.createdAt.toLocaleDateString("fr-FR")}</p></div>
                <div><p className="font-black">{review.user?.name ?? "Client"}</p><p className="text-sm text-neutral-500">{review.restaurant?.name ?? "Restaurant"}</p></div>
                <div><p className="text-sm text-neutral-600">{review.comment ?? "Aucun commentaire."}</p></div>
                <p className="text-xs text-neutral-400">Commande : {review.orderId ?? "—"}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </AdminShell>
  );
}
