import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const role = params?.role === "RESTAURANT" || params?.role === "DELIVERY_DRIVER" ? params.role : "CLIENT";
  return <main className="grid min-h-screen place-items-center bg-dalle-cream px-4 py-10"><RegisterForm role={role} /></main>;
}
