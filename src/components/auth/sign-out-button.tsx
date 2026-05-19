"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  return <Button type="button" variant="dark" className={className} onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={16} /> Déconnexion</Button>;
}
