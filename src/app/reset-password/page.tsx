"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError("Lien invalide ou incomplet.");
    }
  }, [token, email]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.trim().toLowerCase(), token, password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Une erreur est survenue.");
      } else {
        setMessage("Votre mot de passe a été réinitialisé. Connectez-vous.");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Impossible de réinitialiser le mot de passe. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-sm font-black text-dalle-orange">DalleUp</p>
        <h1 className="mt-2 text-3xl font-black">Nouveau mot de passe</h1>
        <p className="mt-2 text-neutral-500">Choisissez un nouveau mot de passe sécurisé.</p>
        {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}
        {message ? <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</div> : null}
        <Input
          className="mt-6"
          placeholder="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          className="mt-3"
          placeholder="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button className="mt-5 w-full" type="submit" disabled={loading || !token || !email}>
          {loading ? "Réinitialisation..." : "Réinitialiser"}
        </Button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-dalle-cream px-4"><p className="text-neutral-500">Chargement...</p></main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
