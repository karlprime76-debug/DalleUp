import Link from "next/link";
import { ArrowRight, LayoutDashboard, Shield } from "lucide-react";
import { getServerSession } from "next-auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/config";
import { getDashboardPathByRole, type UserRole } from "@/lib/auth/roles";

const roleLabel: Record<UserRole, string> = {
  CLIENT: "Profil client",
  RESTAURANT: "Profil restaurant",
  DELIVERY_DRIVER: "Profil livreur",
  ADMIN: "Profil administrateur"
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as UserRole | undefined;
  const dashboardHref = getDashboardPathByRole(role);
  const title = role ? roleLabel[role] : "Profil";

  return (
    <main className="px-4 py-6">
      <Card className="mx-auto max-w-2xl p-6">
        <p className="font-black text-dalle-orange">{title}</p>
        <h1 className="mt-2 text-3xl font-black">{session?.user?.name ?? "Utilisateur DalleUp"}</h1>
        <div className="mt-4 grid gap-2 text-neutral-600">
          <p>Email : <span className="font-bold">{session?.user?.email}</span></p>
          <p>Rôle : <span className="font-bold">{session?.user?.role}</span></p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={dashboardHref}><LayoutDashboard size={18} /> Mon tableau de bord</ButtonLink>
          {role === "ADMIN" ? <ButtonLink href="/admin" variant="secondary"><Shield size={18} /> Administration</ButtonLink> : null}
        </div>
        <div className="mt-6 grid gap-2 text-sm text-neutral-500">
          <Link href="/app" className="flex items-center gap-2 font-bold text-dalle-orange hover:underline"><ArrowRight size={16} /> Retour à l&apos;accueil</Link>
          <Link href="/app/orders" className="flex items-center gap-2 font-bold text-dalle-orange hover:underline"><ArrowRight size={16} /> Mes commandes</Link>
          <Link href="/app/restaurants" className="flex items-center gap-2 font-bold text-dalle-orange hover:underline"><ArrowRight size={16} /> Voir les restaurants</Link>
        </div>
        <SignOutButton className="mt-6" />
      </Card>
    </main>
  );
}
