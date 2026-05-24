// TODO: remove this endpoint after production DB diagnosis
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sanitizeErrorMessage, getPrismaErrorCode, getErrorName } from "@/lib/security/sanitize-error";

export const runtime = "nodejs";

export async function GET() {
  const steps: Array<{ step: string; ok: boolean; error?: { name: string; code: string | null; message: string } }> = [];
  const testEmail = `diag-exact-${Date.now()}@dalleup.test`;

  // Step 1: findUnique (like register existing check)
  try {
    const existing = await prisma.user.findUnique({ where: { email: testEmail } });
    steps.push({ step: "findUnique", ok: true, ...(existing ? {} : {}) });
  } catch (error) {
    steps.push({
      step: "findUnique",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "findUnique failed" },
    });
  }

  // Step 2: bcrypt (like register password hash)
  let passwordHash = "";
  try {
    passwordHash = await bcrypt.hash("Test123456!", 10);
    steps.push({ step: "bcrypt", ok: true });
  } catch (error) {
    steps.push({
      step: "bcrypt",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "bcrypt failed" },
    });
  }

  // Step 3: exact combined transaction (like register)
  let createdUserId: string | null = null;
  try {
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { name: "Diag Exact", email: testEmail, passwordHash, role: "RESTAURANT" },
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
        select: { id: true },
      });
      return createdUser;
    });
    createdUserId = user.id;
    steps.push({ step: "exact-transaction", ok: true });
  } catch (error) {
    steps.push({
      step: "exact-transaction",
      ok: false,
      error: { name: getErrorName(error), code: getPrismaErrorCode(error), message: sanitizeErrorMessage(error) ?? "exact transaction failed" },
    });
  }

  // Step 4: cleanup (delete restaurant first, then user)
  try {
    if (createdUserId) {
      const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: createdUserId }, select: { id: true } });
      if (restaurant) {
        await prisma.restaurant.delete({ where: { id: restaurant.id } });
      }
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
