import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!name || !email || !password || !confirmPassword) return NextResponse.json({ message: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ message: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ message: "Les mots de passe ne correspondent pas." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ message: "Cet email est déjà utilisé." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, email, phone: phone || null, passwordHash, role: "CLIENT" } });
    return NextResponse.json({ message: "Compte créé avec succès." }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Impossible de créer le compte pour le moment." }, { status: 500 });
  }
}
