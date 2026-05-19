"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? "Inscription impossible.");
      return;
    }
    setMessage("Compte créé. Redirection vers la connexion...");
    window.setTimeout(() => router.push("/login"), 900);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-sm">
      <p className="text-sm font-black text-dalle-orange">Créer un compte client</p>
      <h1 className="mt-2 text-3xl font-black">Rejoins DalleUp</h1>
      {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}
      {message ? <div className="mt-5 rounded-2xl bg-lime-50 px-4 py-3 text-sm font-bold text-lime-700">{message}</div> : null}
      <Input name="name" className="mt-6" placeholder="Nom complet" required />
      <Input name="email" className="mt-3" placeholder="Email" type="email" required />
      <Input name="phone" className="mt-3" placeholder="Téléphone" />
      <Input name="password" className="mt-3" placeholder="Mot de passe" type="password" required />
      <Input name="confirmPassword" className="mt-3" placeholder="Confirmer le mot de passe" type="password" required />
      <Button className="mt-5 w-full" type="submit" disabled={loading}>{loading ? "Création..." : "Créer mon compte"}</Button>
      <div className="mt-6 grid gap-2 rounded-3xl bg-dalle-cream p-4 text-sm text-neutral-600"><p className="font-black text-dalle-charcoal">Tu es pro ?</p><Link href="/contact" className="font-black text-dalle-orange">Devenir restaurant partenaire</Link><Link href="/contact" className="font-black text-dalle-orange">Devenir livreur</Link></div>
    </form>
  );
}
