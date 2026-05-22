import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

function isValidLatLng(lat: unknown, lng: unknown) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// GET — récupérer la position du livreur pour une livraison
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const { id } = await params;

    const delivery = await prisma.delivery.findFirst({
      where: { order: { OR: [{ id }, { orderNumber: id }] } },
      include: { order: { include: { restaurant: true } } },
    });
    if (!delivery) return NextResponse.json({ message: "Livraison introuvable." }, { status: 404 });

    const isClient = delivery.order.customerId === session.user.id;
    const isDriver = delivery.driverId === session.user.id;
    const isRestaurantOwner = delivery.order.restaurant.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isClient && !isDriver && !isRestaurantOwner && !isAdmin) {
      return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    }

    const location =
      delivery.currentLatitude !== null &&
      delivery.currentLongitude !== null &&
      delivery.lastLocationAt
        ? {
            latitude: delivery.currentLatitude,
            longitude: delivery.currentLongitude,
            updatedAt: delivery.lastLocationAt.toISOString(),
          }
        : null;

    return NextResponse.json({
      location,
      driverAssigned: !!delivery.driverId,
      status: delivery.status,
      trackingEnabled: delivery.trackingEnabled,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp tracking] GET location", error);
    return NextResponse.json({ message: "Service temporairement indisponible." }, { status: 503 });
  }
}

// PATCH — mettre à jour la position du livreur
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non connecté." }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!isValidLatLng(latitude, longitude)) {
      return NextResponse.json({ message: "Coordonnées invalides." }, { status: 400 });
    }

    const delivery = await prisma.delivery.findFirst({
      where: { order: { OR: [{ id }, { orderNumber: id }] } },
      include: { order: true },
    });
    if (!delivery) return NextResponse.json({ message: "Livraison introuvable." }, { status: 404 });

    const isDriver = delivery.driverId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isDriver && !isAdmin) {
      return NextResponse.json({ message: "Seul le livreur assigné peut mettre à jour la position." }, { status: 403 });
    }

    const updatedAt = new Date();
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationAt: updatedAt,
        trackingEnabled: true,
      },
    });

    return NextResponse.json({ ok: true, latitude, longitude, updatedAt: updatedAt.toISOString() });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[DalleUp tracking] PATCH location", error);
    return NextResponse.json({ message: "Mise à jour indisponible." }, { status: 503 });
  }
}
