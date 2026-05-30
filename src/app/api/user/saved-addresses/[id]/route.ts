import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non connecté." }, { status: 401 });
    }
    const { id } = await params;
    await prisma.savedAddress.deleteMany({
      where: { id, userId: session.user.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DalleUp] DELETE /api/user/saved-addresses/[id]", error);
    return NextResponse.json({ message: "Erreur." }, { status: 503 });
  }
}
