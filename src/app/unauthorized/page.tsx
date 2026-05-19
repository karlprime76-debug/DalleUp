import { getServerSession } from "next-auth";
import { ShieldAlert } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/config";
import { getDashboardPathByRole } from "@/lib/auth/redirects";

export default async function UnauthorizedPage() {
  const session = await getServerSession(authOptions);
  const dashboardPath = getDashboardPathByRole(session?.user?.role);
  return <main className="grid min-h-screen place-items-center bg-dalle-cream px-4"><Card className="max-w-md p-8 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-orange-50 text-dalle-orange"><ShieldAlert size={30} /></div><h1 className="mt-5 text-3xl font-black">Accès refusé</h1><p className="mt-2 text-neutral-500">Ton rôle ne permet pas d’accéder à cette zone DalleUp.</p><div className="mt-6 flex flex-col gap-3"><ButtonLink href={dashboardPath}>Aller à mon espace</ButtonLink><SignOutButton /></div></Card></main>;
}
