import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeErrorMessage, getPrismaErrorCode, getErrorName } from "@/lib/security/sanitize-error";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedPublicRoles = ["CLIENT", "RESTAURANT", "DELIVERY_DRIVER"] as const;

export const runtime = "nodejs";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function getEmailDomain(email: string): string | null {
  try {
    return email.split("@")[1] ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let email = "";
  let requestedRole = "CLIENT";
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(ip, "/api/register");
    if (!limit.ok) {
      return NextResponse.json(
        { message: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
      );
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    requestedRole = String(body.role ?? "CLIENT");

    if (process.env.NODE_ENV !== "production") console.info("[DalleUp register] received", { email, role: requestedRole });

    if (!name || !email || !password || !confirmPassword) return NextResponse.json({ message: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
    if (name.length < 2) return NextResponse.json({ message: "Le nom doit contenir au moins 2 caractères." }, { status: 400 });
    if (!emailRegex.test(email)) return NextResponse.json({ message: "Adresse email invalide." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ message: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ message: "Les mots de passe ne correspondent pas." }, { status: 400 });
    if (!allowedPublicRoles.includes(requestedRole as typeof allowedPublicRoles[number])) return NextResponse.json({ message: "Type de compte invalide." }, { status: 400 });

    if (process.env.NODE_ENV !== "production") console.info("[DalleUp register] validation ok", { email, role: requestedRole });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (process.env.NODE_ENV !== "production") console.info("[DalleUp register] existing user", { email, exists: Boolean(existing) });
    if (existing) return NextResponse.json({ message: "Cet email est déjà utilisé." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { name, email, phone: phone || null, passwordHash, role: requestedRole as typeof allowedPublicRoles[number] },
        select: { id: true, name: true, email: true, role: true }
      });

      if (requestedRole === "RESTAURANT") {
        const baseSlug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "restaurant";
        const slug = `${baseSlug}-${Date.now().toString(36)}`;
        await tx.restaurant.create({
          data: {
            ownerId: createdUser.id,
            name: `Restaurant de ${name}`,
            slug,
            description: "En attente de configuration",
            address: "Non renseigné",
            phone: phone || null,
            status: "PENDING",
          },
          select: { id: true }
        });
      }

      return createdUser;
    });

    return NextResponse.json({ success: true, message: "Compte créé avec succès.", role: user.role, user }, { status: 201 });
  } catch (error) {
    const code = getPrismaErrorCode(error);
    const name = getErrorName(error);
    const detail = sanitizeErrorMessage(error);
    const domain = getEmailDomain(email);

    if (process.env.NODE_ENV !== "production") {
      console.error("[DalleUp register] failed", {
        step: "register-failed",
        role: requestedRole,
        domain,
        name,
        code,
        detail,
        env: process.env.NODE_ENV,
      });
    } else {
      console.error("[DalleUp register] failed", {
        step: "register-failed",
        role: requestedRole,
        domain,
        name,
        code,
      });
    }

    if (code === "P2002") return NextResponse.json({ message: "Cet email est déjà utilisé." }, { status: 409 });
    return NextResponse.json({ message: "Impossible de créer le compte pour le moment. Réessayez plus tard." }, { status: 500 });
  }
}
