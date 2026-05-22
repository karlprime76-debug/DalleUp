import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { authOptions } from "@/lib/auth/config";
import { getDashboardPathByRole, type UserRole } from "@/lib/auth/roles";

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ role?: string }> }) {
  const session = await getServerSession(authOptions);
  const sessionRole = session?.user?.role as UserRole | undefined;
  if (session?.user) redirect(getDashboardPathByRole(sessionRole));
  const params = await searchParams;
  const role = params?.role === "RESTAURANT" || params?.role === "DELIVERY_DRIVER" ? params.role : "CLIENT";
  return <main className="grid min-h-screen place-items-center bg-dalle-cream px-4 py-10"><RegisterForm role={role} /></main>;
}
