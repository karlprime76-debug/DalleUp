import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send-email";
import { formatPrice } from "@/lib/pricing/delivery";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DELIVERY_DRIVER") {
      return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    }

    const body = await request.json();
    const amount = Number(body.amount ?? 0);
    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Montant invalide." }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ message: "Solde insuffisant." }, { status: 400 });
    }

    const [payout] = await prisma.$transaction([
      prisma.payout.create({
        data: {
          userId: session.user.id,
          amount,
          status: "REQUESTED",
        },
      }),
      prisma.wallet.update({
        where: { userId: session.user.id },
        data: {
          balance: { decrement: amount },
          pendingBalance: { increment: amount },
        },
      }),
    ]);

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } });
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Votre demande de retrait DalleUp",
        html: `<p>Bonjour ${user.name || ""},</p><p>Votre demande de retrait de <strong>${formatPrice(amount)}</strong> a été reçue et est en cours de traitement.</p>`,
        text: `Bonjour ${user.name || ""}, Votre demande de retrait de ${formatPrice(amount)} a été reçue et est en cours de traitement.`,
      });
    }

    return NextResponse.json({ payout });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp] POST /api/driver/payout", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
