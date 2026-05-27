"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDashboardPathByRole, type UserRole } from "@/lib/auth/roles";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: String(formData.get("email")), password: String(formData.get("password")), redirect: false });
    if (result?.error) {
      setLoading(false);
      if (result.error.startsWith("RATE_LIMITED:")) {
        const retryAfter = result.error.split(":")[1];
        setError(`Trop de tentatives. Réessayez dans ${retryAfter ?? "quelques"} secondes.`);
      } else {
        setError("Email ou mot de passe incorrect.");
      }
      return;
    }
    const sessionResponse = await fetch("/api/auth/session");
    const session = await sessionResponse.json();
    const role = session?.user?.role as UserRole | undefined;
    router.push(searchParams.get("callbackUrl") ?? (role ? getDashboardPathByRole(role) : "/app"));
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <Link href="/" aria-label="Retour à l'accueil" className="mb-4 inline-flex items-center gap-2 font-black text-dalle-charcoal"><Image src="/brand/dalleup-icon.svg" alt="DalleUp" width={32} height={32} className="rounded-xl shadow-sm" priority /><span>DalleUp</span></Link>
    <form onSubmit={handleSubmit} className="w-full rounded-[2rem] bg-white p-6 shadow-glow">
      <p className="text-sm font-black text-dalle-orange">DalleUp</p>
      <h1 className="mt-2 text-3xl font-black">Connexion</h1>
      {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}
      <Input name="email" className="mt-6" placeholder="Email" type="email" required />
      <Input name="password" className="mt-3" placeholder="Mot de passe" type="password" required />
      <Button className="mt-5 w-full" type="submit" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</Button>
      <p className="mt-4 text-center text-sm text-neutral-500"><Link href="/forgot-password" className="font-black text-dalle-orange">Mot de passe oublié ?</Link></p>
      <p className="mt-2 text-center text-sm text-neutral-500">Pas encore de compte ? <Link href="/register" className="font-black text-dalle-orange">Créer un compte client</Link></p>
    </form>
    </div>
  );
}
