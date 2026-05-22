"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const roleContent = {
  CLIENT: { eyebrow: "Créer un compte client", title: "Créer un compte client", cta: "Créer mon compte", note: null },
  RESTAURANT: { eyebrow: "Restaurant partenaire", title: "Devenir restaurant partenaire", cta: "Créer mon compte restaurant", note: "Votre demande pourra être vérifiée avant activation complète." },
  DELIVERY_DRIVER: { eyebrow: "Livreur DalleUp", title: "Devenir livreur DalleUp", cta: "Créer mon compte livreur", note: "Votre profil pourra être vérifié avant activation complète." }
};

function getPasswordStrength(password: string): { label: string; color: string } {
  if (password.length < 8) return { label: "Faible", color: "bg-red-400" };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  if (score <= 2) return { label: "Moyen", color: "bg-yellow-400" };
  return { label: "Fort", color: "bg-lime-500" };
}

function suggestPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  const symbols = "!@#$%&*-_";
  const symbol = symbols.charAt(Math.floor(Math.random() * symbols.length));
  return `DalleUp-${result}${symbol}`;
}

export function RegisterForm({ role = "CLIENT" }: { role?: "CLIENT" | "RESTAURANT" | "DELIVERY_DRIVER" }) {
  const router = useRouter();
  const content = roleContent[role];
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function applySuggestion() {
    const suggested = suggestPassword();
    setPassword(suggested);
    setConfirmPassword(suggested);
    setShowPassword(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(formData), role })
      });
      const payload = await response.json().catch(() => null);
      setLoading(false);
      if (!response.ok) {
        setError(payload?.message ?? "Inscription impossible.");
        return;
      }
      setMessage("Compte créé avec succès. Connectez-vous pour continuer.");
      window.setTimeout(() => router.push("/login"), 900);
    } catch {
      setLoading(false);
      setError("Inscription impossible pour le moment. Réessaie dans quelques instants.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-sm">
      <p className="text-sm font-black text-dalle-orange">{content.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black">{content.title}</h1>
      {content.note ? <p className="mt-3 rounded-2xl bg-dalle-cream px-4 py-3 text-sm font-bold text-neutral-600">{content.note}</p> : null}
      {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}
      {message ? <div className="mt-5 rounded-2xl bg-lime-50 px-4 py-3 text-sm font-bold text-lime-700">{message}</div> : null}
      <Input name="name" className="mt-6" placeholder="Nom complet" required />
      <Input name="email" className="mt-3" placeholder="Email" type="email" required />
      <Input name="phone" className="mt-3" placeholder="Téléphone" />
      <div className="mt-3 relative">
        <Input name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe" type={showPassword ? "text" : "password"} required className="pr-10" />
        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500 hover:text-dalle-orange" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? "Masquer" : "Afficher"}</button>
      </div>
      {password ? (
        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-neutral-500">
          <span>Robustesse :</span>
          <span className={`inline-block h-2 w-16 rounded-full ${strength.color}`} />
          <span>{strength.label}</span>
        </div>
      ) : null}
      <div className="mt-2">
        <button type="button" onClick={applySuggestion} className="text-xs font-bold text-dalle-orange hover:underline">Suggérer un mot de passe</button>
      </div>
      <Input name="confirmPassword" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirmer le mot de passe" type={showPassword ? "text" : "password"} required className="mt-3" />
      <Button className="mt-5 w-full" type="submit" disabled={loading}>{loading ? "Création..." : content.cta}</Button>
      <div className="mt-6 grid gap-2 rounded-3xl bg-dalle-cream p-4 text-sm text-neutral-600">
        <p className="font-black text-dalle-charcoal">Tu es pro ?</p>
        <Link href="/register?role=RESTAURANT" className="font-black text-dalle-orange">Devenir restaurant partenaire</Link>
        <Link href="/register?role=DELIVERY_DRIVER" className="font-black text-dalle-orange">Devenir livreur</Link>
      </div>
    </form>
  );
}
