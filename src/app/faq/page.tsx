import { SiteHeader } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";

const faqs = [
  { question: "DalleUp est-il déjà disponible ?", answer: "Oui, la plateforme est active. Vous pouvez commander dès maintenant auprès des restaurants partenaires approuvés." },
  { question: "Puis-je commander sans compte ?", answer: "Non, un compte est nécessaire pour passer une commande et suivre votre historique. L’inscription est rapide." },
  { question: "Comment devenir restaurant partenaire ?", answer: "Inscrivez-vous en tant que restaurant sur la page d’inscription, complétez votre profil et soumettez votre demande. Notre équipe l’examinera sous peu." },
  { question: "Les paiements Mobile Money sont-ils actifs ?", answer: "Les paiements par Mobile Money et carte sont en cours d’intégration. Pour le moment, le paiement à la livraison est disponible." }
];

export default function FaqPage() {
  return <><SiteHeader /><main className="min-h-screen bg-dalle-cream px-4 py-16"><div className="mx-auto max-w-4xl"><p className="font-black text-dalle-orange">FAQ</p><h1 className="mt-2 text-4xl font-black text-dalle-charcoal">Questions fréquentes</h1><div className="mt-8 grid gap-4">{faqs.map((faq) => <Card key={faq.question} className="p-6"><h2 className="font-black">{faq.question}</h2><p className="mt-2 text-neutral-600">{faq.answer}</p></Card>)}</div></div></main></>;
}
