import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function DriverPendingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4">
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-orange-50 text-dalle-orange">
          <Clock size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-dalle-charcoal">Votre profil livreur est en attente de validation.</h1>
        <p className="mt-3 text-neutral-500">Votre demande est en cours de vérification. Vous recevrez une notification après validation.</p>
        <p className="mt-2 text-sm text-neutral-400">Cela peut prendre jusqu’à 24 heures ouvrées.</p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </Card>
    </main>
  );
}
