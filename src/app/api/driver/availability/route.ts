import { NextResponse } from "next/server";
import { DriverStatus } from "@prisma/client";
import { requireApprovedDriverApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

const allowedSelfStatuses = ["AVAILABLE", "OFFLINE"] as const;

export async function PATCH(request: Request) {
  try {
    const result = await requireApprovedDriverApi();
    if ("response" in result) return result.response;
    const { session } = result;

    const body = await request.json();
    const status = String(body.status ?? "");

    if (!allowedSelfStatuses.includes(status as typeof allowedSelfStatuses[number])) {
      return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
    }

    const driver = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!driver) return NextResponse.json({ message: "Profil introuvable." }, { status: 404 });
    if (driver.driverStatus === "ON_DELIVERY") {
      return NextResponse.json({ message: "Vous ne pouvez pas modifier votre disponibilité pendant une livraison." }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { driverStatus: status as DriverStatus },
    });

    return NextResponse.json({ driver: updated });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp] PATCH /api/driver/availability", error);
    return NextResponse.json({ message: "Indisponible." }, { status: 503 });
  }
}
