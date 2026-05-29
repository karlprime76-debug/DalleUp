export type PayoutProvider = "PAYDUNYA" | "MANUAL" | "MOCK";

export type CreatePayoutInput = {
  amount: number;
  currency: string;
  beneficiaryType: "RESTAURANT" | "COURIER";
  beneficiaryId: string;
  phone?: string;
  accountAlias?: string;
  accountName?: string;
  reference: string;
};

export type PayoutResult = {
  ok: boolean;
  providerRef?: string;
  providerToken?: string;
  error?: string;
  raw?: unknown;
};

export function resolvePayoutProvider(): PayoutProvider {
  const env = process.env.PAYOUT_PROVIDER ?? "";
  if (env === "PAYDUNYA") return "PAYDUNYA";
  if (env === "MANUAL") return "MANUAL";
  if (process.env.NODE_ENV !== "production") return "MOCK";
  return "MANUAL";
}

export async function createPayout(
  provider: PayoutProvider,
  input: CreatePayoutInput
): Promise<PayoutResult> {
  if (provider === "PAYDUNYA") {
    // TODO: implémenter l'API de reversement PayDunya quand disponible
    return {
      ok: false,
      error: "Payout PayDunya non encore implémenté. Utilisez MANUAL ou MOCK.",
    };
  }

  if (provider === "MANUAL") {
    return {
      ok: true,
      providerRef: `manual-${input.reference}-${Date.now()}`,
    };
  }

  if (provider === "MOCK") {
    return {
      ok: true,
      providerRef: `mock-${input.reference}-${Date.now()}`,
    };
  }

  return { ok: false, error: `Provider ${provider} non supporté.` };
}

export async function checkPayoutStatus(): Promise<{ ok: boolean; status?: string; error?: string }> {
  return { ok: true, status: "unknown" };
}
