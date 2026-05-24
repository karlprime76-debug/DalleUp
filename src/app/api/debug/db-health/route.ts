// TODO: remove this endpoint after production DB diagnosis
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sanitizeErrorMessage, getPrismaErrorCode, getErrorName } from "@/lib/security/sanitize-error";

export const runtime = "nodejs";

export async function GET() {
  const envCheck = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    NODE_ENV: process.env.NODE_ENV ?? "unknown",
  };

  try {
    // Test 1: raw SQL SELECT 1
    await prisma.$queryRaw`SELECT 1`;

    // Test 2: user count
    const userCount = await prisma.user.count();

    // Test 3: restaurant count
    const restaurantCount = await prisma.restaurant.count();

    return NextResponse.json({
      ok: true,
      env: envCheck,
      db: {
        select1: true,
        userCount: userCount,
        restaurantCount: restaurantCount,
      },
    });
  } catch (error) {
    const safeMessage = sanitizeErrorMessage(error) ?? "Unknown database error";
    const code = getPrismaErrorCode(error);
    const name = getErrorName(error);

    if (process.env.NODE_ENV !== "production") {
      console.error("[db-health] diagnosis failed", { name, code, message: safeMessage });
    }

    return NextResponse.json({
      ok: false,
      env: envCheck,
      db: {
        select1: false,
      },
      error: {
        name,
        code,
        message: safeMessage,
      },
    }, { status: 500 });
  }
}
