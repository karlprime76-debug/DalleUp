import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send-email";
import { formatPrice } from "@/lib/pricing/delivery";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "");
    if (status !== "PAID" && status !== "FAILED") {
      return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
    }

    const payout = await prisma.payout.findUnique({ where: { id } });
    if (!payout) return NextResponse.json({ message: "Retrait introuvable." }, { status: 404 });
    if (payout.status !== "REQUESTED" && payout.status !== "PROCESSING") {
      return NextResponse.json({ message: "Retrait déjà traité." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payout.userId },
      select: { name: true, email: true },
    });

    const updated = await prisma.payout.update({
      where: { id },
      data: { status, paidAt: status === "PAID" ? new Date() : null },
    });

    if (status === "PAID" && user?.email) {
      const userName = user.name || "Utilisateur";
      await sendEmail({
        to: user.email,
        subject: "Votre retrait DalleUp a été payé",
        html: `<p>Bonjour ${userName},</p><p>Votre demande de retrait de <strong>${formatPrice(payout.amount)}</strong> a été payée.</p><p>Merci d'utiliser DalleUp.</p>`,
        text: `Bonjour ${userName}, Votre demande de retrait de ${formatPrice(payout.amount)} a été payée. Merci d'utiliser DalleUp.`,
      });
    }

    return NextResponse.json({ payout: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp] PATCH /api/admin/payouts/[id]", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
