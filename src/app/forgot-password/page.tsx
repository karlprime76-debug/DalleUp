"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Une erreur est survenue.");
      } else {
        setMessage("Si cet email existe, un lien de réinitialisation a été envoyé.");
        setEmail("");
      }
    } catch {
      setError("Impossible d'envoyer la demande. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-sm font-black text-dalle-orange">DalleUp</p>
        <h1 className="mt-2 text-3xl font-black">Mot de passe oublié</h1>
        <p className="mt-2 text-neutral-500">Entrez votre email pour recevoir un lien de réinitialisation.</p>
        {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}
        {message ? <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</div> : null}
        <Input
          className="mt-6"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button className="mt-5 w-full" type="submit" disabled={loading}>
          {loading ? "Envoi en cours..." : "Envoyer le lien"}
        </Button>
      </form>
    </main>
  );
}
