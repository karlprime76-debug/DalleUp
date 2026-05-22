import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function RestaurantSuspendedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4">
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-orange-50 text-dalle-orange">
          <ShieldAlert size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-dalle-charcoal">Compte suspendu.</h1>
        <p className="mt-3 text-neutral-500">Votre compte restaurant a été suspendu. Contactez le support pour plus d’informations.</p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </Card>
    </main>
  );
}
