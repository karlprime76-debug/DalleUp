import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send-email";
import { passwordResetSuccess } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const limit = rateLimitRequest(request, "/api/auth/reset-password");
    if (!limit.ok) {
      return NextResponse.json(
        { message: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Email invalide." }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ message: "Token manquant." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `reset:${email}`,
          token,
        },
      },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { message: "Lien invalide ou expiré." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { message: "Lien invalide ou expiré." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `reset:${email}`,
            token,
          },
        },
      }),
    ]);

    const template = passwordResetSuccess(user.name || "Utilisateur");
    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return NextResponse.json(
      { message: "Mot de passe réinitialisé avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[reset-password]", error);
    return NextResponse.json(
      { message: "Impossible de réinitialiser le mot de passe." },
      { status: 500 }
    );
  }
}
