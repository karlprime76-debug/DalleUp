import { getServerSession } from "next-auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/config";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  return <main className="px-4 py-6"><Card className="mx-auto max-w-2xl p-6"><p className="font-black text-dalle-orange">Profil client</p><h1 className="mt-2 text-3xl font-black">{session?.user?.name ?? "Client DalleUp"}</h1><div className="mt-4 grid gap-2 text-neutral-600"><p>Email : <span className="font-bold">{session?.user?.email}</span></p><p>Rôle : <span className="font-bold">{session?.user?.role}</span></p></div><SignOutButton className="mt-6" /></Card></main>;
}
