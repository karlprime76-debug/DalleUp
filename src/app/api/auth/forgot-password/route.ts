import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send-email";
import { passwordReset } from "@/lib/email/templates";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function getAppUrl(): string {
  return process.env.APP_URL || process.env.NEXTAUTH_URL || "https://dalleup.vercel.app";
}

export async function POST(request: Request) {
  try {
    const limit = rateLimitRequest(request, "/api/auth/forgot-password");
    if (!limit.ok) {
      return NextResponse.json(
        { message: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Adresse email invalide." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { message: "Si cet email existe, un lien a été envoyé." },
        { status: 200 }
      );
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires,
      },
    });

    const resetUrl = `${getAppUrl()}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const template = passwordReset(user.name || "Utilisateur", resetUrl);

    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return NextResponse.json(
      { message: "Si cet email existe, un lien a été envoyé." },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[forgot-password]", error);
    return NextResponse.json(
      { message: "Si cet email existe, un lien a été envoyé." },
      { status: 200 }
    );
  }
}
