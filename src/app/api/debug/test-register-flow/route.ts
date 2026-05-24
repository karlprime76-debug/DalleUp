// TODO: remove this endpoint after production DB diagnosis
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sanitizeErrorMessage, getPrismaErrorCode, getErrorName } from "@/lib/security/sanitize-error";

export const runtime = "nodejs";

export async function GET() {
  const steps: Array<{ step: string; ok: boolean; error?: { name: string; code: string | null; message: string } }> = [];

  // Step 1: bcrypt
  try {
    const hash = await bcrypt.hash("test-password-123", 10);
    steps.push({ step: "bcrypt-hash", ok: Boolean(hash) });
  } catch (error) {
    steps.push({
      step: "bcrypt-hash",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "bcrypt failed" },
    });
  }

  // Step 2: raw query
  try {
    await prisma.$queryRaw`SELECT 1`;
    steps.push({ step: "prisma-raw-query", ok: true });
  } catch (error) {
    steps.push({
      step: "prisma-raw-query",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "raw query failed" },
    });
  }

  // Step 3: user create inside transaction (then delete)
  const testEmail = `diag-${Date.now()}@dalleup.test`;
  let createdUserId: string | null = null;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Diag User",
          email: testEmail,
          passwordHash: "test-hash",
          role: "CLIENT",
        },
        select: { id: true, email: true },
      });
      return user;
    });
    createdUserId = result.id;
    steps.push({ step: "transaction-user-create", ok: true });
  } catch (error) {
    steps.push({
      step: "transaction-user-create",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "transaction user create failed" },
    });
  }

  // Step 4: restaurant create inside transaction (then delete)
  let createdRestaurantId: string | null = null;
  if (createdUserId) {
    try {
      const restaurant = await prisma.$transaction(async (tx) => {
        const r = await tx.restaurant.create({
          data: {
            ownerId: createdUserId!,
            name: "Diag Restaurant",
            slug: `diag-restaurant-${Date.now().toString(36)}`,
            description: "Diagnostic",
            address: "Diag Address",
            phone: null,
            status: "PENDING",
          },
          select: { id: true },
        });
        return r;
      });
      createdRestaurantId = restaurant.id;
      steps.push({ step: "transaction-restaurant-create", ok: true });
    } catch (error) {
      steps.push({
        step: "transaction-restaurant-create",
        ok: false,
        error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "transaction restaurant create failed" },
      });
    }
  }

  // Cleanup
  try {
    if (createdRestaurantId) {
      await prisma.restaurant.delete({ where: { id: createdRestaurantId } });
    }
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } });
    }
    steps.push({ step: "cleanup", ok: true });
  } catch (error) {
    steps.push({
      step: "cleanup",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "cleanup failed" },
    });
  }

  // Step 5: combined transaction (like /api/register)
  const testEmail2 = `diag-combined-${Date.now()}@dalleup.test`;
  let combinedUserId: string | null = null;
  try {
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { name: "Diag Combined", email: testEmail2, passwordHash: "test-hash", role: "RESTAURANT" },
        select: { id: true, name: true, email: true, role: true },
      });
      const baseSlug = String(createdUser.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "restaurant";
      const slug = `${baseSlug}-${Date.now().toString(36)}`;
      await tx.restaurant.create({
        data: {
          ownerId: createdUser.id,
          name: `Restaurant de ${createdUser.name}`,
          slug,
          description: "En attente de configuration",
          address: "Non renseigné",
          phone: null,
          status: "PENDING",
        },
      });
      return createdUser;
    });
    combinedUserId = user.id;
    steps.push({ step: "combined-transaction", ok: true });
  } catch (error) {
    steps.push({
      step: "combined-transaction",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "combined transaction failed" },
    });
  }

  // Step 6: cleanup combined
  try {
    if (combinedUserId) {
      await prisma.user.delete({ where: { id: combinedUserId } });
    }
    steps.push({ step: "cleanup-combined", ok: true });
  } catch (error) {
    steps.push({
      step: "cleanup-combined",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "cleanup combined failed" },
    });
  }

  return NextResponse.json({
    ok: steps.every((s) => s.ok),
    steps,
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      DIRECT_URL: Boolean(process.env.DIRECT_URL),
      NODE_ENV: process.env.NODE_ENV ?? "unknown",
    },
  });
}
