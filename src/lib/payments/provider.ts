import {
  createPaydunyaCheckoutInvoice,
  confirmPaydunyaInvoice,
  getPaydunyaConfig,
  verifyPaydunyaIpnHash,
  type PaydunyaResponse,
} from "./paydunya";

export type PaymentProvider = "PAYDUNYA" | "MOCK" | "CASH_ON_DELIVERY";

export type CreateCheckoutInput = {
  orderId: string;
  orderNumber: string;
  total: number;
  description: string;
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number; description?: string }[];
  customer: { name?: string; email?: string; phone?: string };
  customData: Record<string, string>;
  returnUrl: string;
  cancelUrl: string;
  callbackUrl: string;
};

export type CheckoutResult = {
  ok: boolean;
  checkoutUrl?: string;
  token?: string;
  providerRef?: string;
  error?: string;
  raw?: unknown;
};

export type ConfirmResult = {
  ok: boolean;
  paid?: boolean;
  amount?: number;
  token?: string;
  error?: string;
  raw?: unknown;
};

function getProviderFromMethod(method: string): PaymentProvider {
  if (method === "PAYDUNYA") return "PAYDUNYA";
  if (method === "CASH_ON_DELIVERY") return "CASH_ON_DELIVERY";
  if (process.env.NODE_ENV !== "production") return "MOCK";
  return "MOCK";
}

export function resolvePaymentProvider(method: string): PaymentProvider {
  return getProviderFromMethod(method);
}

export async function createCheckout(
  provider: PaymentProvider,
  input: CreateCheckoutInput
): Promise<CheckoutResult> {
  if (provider === "PAYDUNYA") {
    try {
      const config = getPaydunyaConfig();
      const invoice = await createPaydunyaCheckoutInvoice({
        invoice: {
          total_amount: input.total,
          description: input.description,
          items: input.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            total_price: i.totalPrice,
            description: i.description,
          })),
        },
        store: { name: config.storeName },
        actions: {
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
          callback_url: input.callbackUrl,
        },
        custom_data: input.customData,
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
        },
      });

      if (invoice.response_code !== "00") {
        return { ok: false, error: "PayDunya a refusé la création de facture.", raw: invoice };
      }
      const token = typeof invoice.token === "string" ? invoice.token : undefined;
      const checkoutUrl =
        typeof invoice.response_text === "string"
          ? invoice.response_text
          : typeof invoice.invoice_url === "string"
            ? invoice.invoice_url
            : undefined;
      if (!token || !checkoutUrl) {
        return { ok: false, error: "Réponse PayDunya incomplète.", raw: invoice };
      }
      return { ok: true, checkoutUrl, token, providerRef: token, raw: invoice };
    } catch (error) {
      return { ok: false, error: "Initialisation PayDunya impossible.", raw: error };
    }
  }

  if (provider === "MOCK") {
    const token = `mock-${input.orderId}-${Date.now()}`;
    const checkoutUrl = `${input.returnUrl}?mock=1&token=${encodeURIComponent(token)}`;
    return { ok: true, checkoutUrl, token, providerRef: token };
  }

  return { ok: false, error: `Provider ${provider} non supporté pour le checkout.` };
}

export async function confirmPayment(
  provider: PaymentProvider,
  token: string
): Promise<ConfirmResult> {
  if (provider === "PAYDUNYA") {
    try {
      const confirmation = await confirmPaydunyaInvoice(token);
      if (confirmation.response_code !== "00") {
        return { ok: true, paid: false, raw: confirmation };
      }
      const invoice = (confirmation.invoice ?? {}) as Record<string, unknown>;
      const status = String(confirmation.status ?? invoice.status ?? "").toLowerCase();
      const totalAmount =
        typeof confirmation.total_amount === "number"
          ? confirmation.total_amount
          : typeof invoice.total_amount === "number"
            ? invoice.total_amount
            : Number.NaN;
      const paid = status === "completed";
      return { ok: true, paid, amount: Number.isFinite(totalAmount) ? totalAmount : undefined, token, raw: confirmation };
    } catch (error) {
      return { ok: false, error: "Confirmation PayDunya impossible.", raw: error };
    }
  }

  if (provider === "MOCK") {
    return { ok: true, paid: true, token };
  }

  return { ok: false, error: `Provider ${provider} non supporté pour la confirmation.` };
}

export { verifyPaydunyaIpnHash };
export type { PaydunyaResponse };
