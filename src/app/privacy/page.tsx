import Link from "next/link";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Politique de confidentialité — DalleUp",
  description: "Comment DalleUp protège vos données personnelles.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-dalle-cream px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-black text-dalle-orange">← Accueil</Link>
        <Card className="mt-6 p-8">
          <h1 className="text-3xl font-black text-dalle-charcoal">Politique de confidentialité</h1>
          <p className="mt-2 text-sm text-neutral-500">Dernière mise à jour : mai 2026</p>

          <section className="mt-6">
            <h2 className="text-xl font-black">1. Données collectées</h2>
            <p className="mt-2 text-neutral-600">Nous collectons uniquement les données nécessaires au fonctionnement du service : nom, email, téléphone, adresse de livraison, historique de commandes, et documents de vérification pour les partenaires (restaurants, livreurs).</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-black">2. Utilisation des données</h2>
            <p className="mt-2 text-neutral-600">Vos données sont utilisées pour : traiter vos commandes, assurer la livraison, gérer votre compte partenaire, et vous contacter en cas de besoin. Nous ne vendons jamais vos données à des tiers.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-black">3. Conservation</h2>
            <p className="mt-2 text-neutral-600">Les données de commande sont conservées 3 ans à des fins comptables et fiscales. Les documents de vérification sont conservés pendant la durée de l&apos;activité partenaire, puis supprimés sous 30 jours.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-black">4. Vos droits</h2>
            <p className="mt-2 text-neutral-600">Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement et de portabilité. Pour exercer vos droits, contactez-nous ou utilisez la page <Link href="/delete-account" className="font-bold text-dalle-orange underline">suppression de compte</Link>.</p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-black">5. Cookies</h2>
            <p className="mt-2 text-neutral-600">DalleUp utilise des cookies strictement nécessaires à l&apos;authentification et au fonctionnement du site. Aucun cookie de traçage publicitaire n&apos;est utilisé.</p>
          </section>
        </Card>
      </div>
    </main>
  );
}
