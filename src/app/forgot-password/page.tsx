import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return <main className="grid min-h-screen place-items-center bg-dalle-cream px-4"><form className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-sm"><h1 className="text-3xl font-black">Mot de passe oublié</h1><p className="mt-2 text-neutral-500">Entre ton email pour recevoir un lien de réinitialisation.</p><input className="mt-6 w-full rounded-2xl border px-4 py-3" placeholder="Email" /><Button className="mt-5 w-full" type="button">Envoyer le lien</Button></form></main>;
}
