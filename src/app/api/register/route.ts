import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedPublicRoles = ["CLIENT", "RESTAURANT", "DELIVERY_DRIVER"] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    const requestedRole = String(body.role ?? "CLIENT");

    if (!name || !email || !password || !confirmPassword) return NextResponse.json({ message: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
    if (name.length < 2) return NextResponse.json({ message: "Le nom doit contenir au moins 2 caractères." }, { status: 400 });
    if (!emailRegex.test(email)) return NextResponse.json({ message: "Adresse email invalide." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ message: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ message: "Les mots de passe ne correspondent pas." }, { status: 400 });
    if (!allowedPublicRoles.includes(requestedRole as typeof allowedPublicRoles[number])) return NextResponse.json({ message: "Type de compte invalide." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ message: "Cet email est déjà utilisé." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, email, phone: phone || null, passwordHash, role: requestedRole as typeof allowedPublicRoles[number] } });
    return NextResponse.json({ message: "Compte créé avec succès." }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Impossible de créer le compte pour le moment." }, { status: 500 });
  }
}
