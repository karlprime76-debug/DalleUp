import { SiteHeader } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";

const faqs = [
  { question: "DalleUp est-il déjà disponible ?", answer: "Le MVP est en ligne pour présenter l’expérience et tester les parcours essentiels." },
  { question: "Puis-je commander sans compte ?", answer: "Le parcours complet de commande est prévu pour les utilisateurs connectés afin de suivre l’historique." },
  { question: "Comment devenir restaurant partenaire ?", answer: "Utilise la page partenaires ou le formulaire d’inscription restaurant pour manifester ton intérêt." },
  { question: "Les paiements Mobile Money sont-ils actifs ?", answer: "Ils sont prévus dans la feuille de route. Le MVP privilégie d’abord la validation du parcours commande." }
];

export default function FaqPage() {
  return <><SiteHeader /><main className="min-h-screen bg-dalle-cream px-4 py-16"><div className="mx-auto max-w-4xl"><p className="font-black text-dalle-orange">FAQ</p><h1 className="mt-2 text-4xl font-black text-dalle-charcoal">Questions fréquentes</h1><div className="mt-8 grid gap-4">{faqs.map((faq) => <Card key={faq.question} className="p-6"><h2 className="font-black">{faq.question}</h2><p className="mt-2 text-neutral-600">{faq.answer}</p></Card>)}</div></div></main></>;
}
