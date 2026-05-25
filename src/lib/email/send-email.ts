import { Resend } from "resend";

let resend: Resend | null = null;

try {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    resend = new Resend(apiKey);
  }
} catch {
  resend = null;
}

const DEFAULT_FROM = process.env.MAIL_FROM || "DalleUp <no-reply@dalleup.com>";

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const toArray = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validEmails = toArray.filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)));

  if (!validEmails.length) {
    console.warn("[email] Aucun destinataire valide.");
    return { success: false, error: "Aucun destinataire valide." };
  }

  if (!resend) {
    console.warn("[email] RESEND_API_KEY manquante : email non envoyé.");
    return { success: false, error: "Service email non configuré." };
  }

  try {
    const result = await resend.emails.send({
      from: payload.from || DEFAULT_FROM,
      to: validEmails,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (result.error) {
      const errorDetail = `${result.error.name}: ${result.error.message ?? ""}`;
      console.error("[email] Erreur Resend", { to: validEmails.length, subject: payload.subject.slice(0, 30), error: errorDetail });
      return { success: false, error: errorDetail };
    }

    return { success: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "inconnue";
    console.error("[email] Exception Resend", { to: validEmails.length, subject: payload.subject.slice(0, 30), error: detail });
    return { success: false, error: "Échec d'envoi." };
  }
}
