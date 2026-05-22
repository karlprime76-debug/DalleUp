import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth/config";
import { getDashboardPathByRole, type UserRole } from "@/lib/auth/roles";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as UserRole | undefined;
  if (session?.user) redirect(getDashboardPathByRole(role));
  return <main className="grid min-h-screen place-items-center bg-dalle-charcoal px-4"><Suspense><LoginForm /></Suspense></main>;
}
