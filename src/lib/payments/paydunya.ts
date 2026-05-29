import crypto from "crypto";

export type PaydunyaMode = "sandbox" | "production";

export type PaydunyaInvoiceItem = {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
};

export type PaydunyaCheckoutInput = {
  invoice: {
    total_amount: number;
    description: string;
    items: PaydunyaInvoiceItem[];
  };
  store?: { name?: string };
  actions: {
    return_url: string;
    cancel_url: string;
    callback_url: string;
  };
  custom_data: Record<string, string>;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export type PaydunyaResponse = {
  response_code?: string;
  response_text?: string;
  token?: string;
  invoice_url?: string;
  status?: string;
  [key: string]: unknown;
};

export function getPaydunyaConfig() {
  const mode = process.env.PAYDUNYA_MODE === "production" ? "production" : "sandbox";
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const publicKey = process.env.PAYDUNYA_PUBLIC_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  const storeName = process.env.PAYDUNYA_STORE_NAME ?? "DalleUp";
  const appUrl = (process.env.APP_URL ?? "https://dalleup.vercel.app").replace(/\/$/, "");

  if (!masterKey || !privateKey || !token) throw new Error("Configuration PayDunya incomplète.");

  const baseUrl = mode === "production" ? "https://app.paydunya.com/api/v1" : "https://app.paydunya.com/sandbox-api/v1";
  return { mode, masterKey, privateKey, publicKey, token, storeName, appUrl, baseUrl };
}

function headers(config: ReturnType<typeof getPaydunyaConfig>) {
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": config.masterKey,
    "PAYDUNYA-PRIVATE-KEY": config.privateKey,
    "PAYDUNYA-TOKEN": config.token
  };
}

export async function createPaydunyaCheckoutInvoice(input: PaydunyaCheckoutInput): Promise<PaydunyaResponse> {
  const config = getPaydunyaConfig();
  const response = await fetch(`${config.baseUrl}/checkout-invoice/create`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({ ...input, store: { name: input.store?.name ?? config.storeName } })
  });
  return await response.json() as PaydunyaResponse;
}

export async function confirmPaydunyaInvoice(token: string): Promise<PaydunyaResponse> {
  const config = getPaydunyaConfig();
  const response = await fetch(`${config.baseUrl}/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: headers(config)
  });
  return await response.json() as PaydunyaResponse;
}

export function verifyPaydunyaIpnHash(receivedHash?: string | null) {
  const config = getPaydunyaConfig();
  if (!receivedHash) return false;
  const expectedHash = crypto.createHash("sha512").update(config.masterKey).digest("hex");
  if (receivedHash.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
}
