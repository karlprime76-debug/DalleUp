import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedPublicRoles = ["CLIENT", "RESTAURANT", "DELIVERY_DRIVER"] as const;

function getPrismaCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String(error.code) : null;
}

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : typeof error;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    const requestedRole = String(body.role ?? "CLIENT");

    console.info("[DalleUp register] received", { email, role: requestedRole });

    if (!name || !email || !password || !confirmPassword) return NextResponse.json({ message: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
    if (name.length < 2) return NextResponse.json({ message: "Le nom doit contenir au moins 2 caractères." }, { status: 400 });
    if (!emailRegex.test(email)) return NextResponse.json({ message: "Adresse email invalide." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ message: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ message: "Les mots de passe ne correspondent pas." }, { status: 400 });
    if (!allowedPublicRoles.includes(requestedRole as typeof allowedPublicRoles[number])) return NextResponse.json({ message: "Type de compte invalide." }, { status: 400 });

    console.info("[DalleUp register] validation ok", { email, role: requestedRole });

    const existing = await prisma.user.findUnique({ where: { email } });
    console.info("[DalleUp register] existing user", { email, exists: Boolean(existing) });
    if (existing) return NextResponse.json({ message: "Cet email est déjà utilisé." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, phone: phone || null, passwordHash, role: requestedRole as typeof allowedPublicRoles[number] }, select: { id: true, name: true, email: true, role: true } });

    return NextResponse.json({ success: true, message: "Compte créé avec succès.", role: user.role, user }, { status: 201 });
  } catch (error) {
    const code = getPrismaCode(error);
    const name = getErrorName(error);
    console.warn("[DalleUp register] failed", { code, name });
    if (code === "P2002") return NextResponse.json({ message: "Cet email est déjà utilisé." }, { status: 409 });
    return NextResponse.json({ message: "Impossible de créer le compte pour le moment.", debugCode: code, debugName: name }, { status: 500 });
  }
}
