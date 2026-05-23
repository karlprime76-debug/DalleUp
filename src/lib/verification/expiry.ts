export const RESIDENCE_PROOF_VALIDITY_MONTHS = 3;
export const RESIDENCE_PROOF_EXPIRING_SOON_DAYS = 15;
export const RESIDENCE_PROOF_GRACE_DAYS = 7;

export type ResidenceProofLifecycleStatus = "missing" | "submitted" | "approved" | "rejected" | "expired" | "expiring_soon";

export function getDocumentExpiryDate(reviewedAt: string | Date): Date {
  const date = new Date(reviewedAt);
  date.setMonth(date.getMonth() + RESIDENCE_PROOF_VALIDITY_MONTHS);
  return date;
}

export function isDocumentExpired(expiresAt?: string | Date | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function isDocumentExpiringSoon(expiresAt?: string | Date | null): boolean {
  if (!expiresAt || isDocumentExpired(expiresAt)) return false;
  const expiryTime = new Date(expiresAt).getTime();
  const alertTime = Date.now() + RESIDENCE_PROOF_EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
  return expiryTime <= alertTime;
}

export function isResidenceProofInGracePeriod(expiresAt?: string | Date | null): boolean {
  if (!expiresAt || !isDocumentExpired(expiresAt)) return false;
  const graceLimit = new Date(expiresAt).getTime() + RESIDENCE_PROOF_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return graceLimit >= Date.now();
}

export function getResidenceProofLifecycleStatus(input: {
  status?: string;
  expiresAt?: string | Date | null;
}): ResidenceProofLifecycleStatus {
  if (!input.status) return "missing";
  if (input.status === "REJECTED") return "rejected";
  if (input.status === "PENDING_REVIEW") return "submitted";
  if (input.status === "APPROVED" && isDocumentExpired(input.expiresAt)) return "expired";
  if (input.status === "APPROVED" && isDocumentExpiringSoon(input.expiresAt)) return "expiring_soon";
  if (input.status === "APPROVED") return "approved";
  return "submitted";
}

export function getResidenceProofAlertMessage(status: ResidenceProofLifecycleStatus, role: "RESTAURANT" | "DELIVERY_DRIVER") {
  if (status === "missing") return role === "RESTAURANT" ? "Ajoutez une preuve de résidence du responsable." : "Ajoutez une preuve de résidence récente.";
  if (status === "submitted") return "Votre preuve de résidence est en attente de validation.";
  if (status === "approved") return "Votre preuve de résidence a été validée.";
  if (status === "rejected") return "Votre preuve de résidence a été rejetée.";
  if (status === "expired") return role === "DELIVERY_DRIVER" ? "Votre preuve de résidence a expiré. Renouvelez-la pour continuer à recevoir des livraisons." : "Votre preuve de résidence a expiré. Renouvelez-la pour conserver votre validation.";
  return "Votre preuve de résidence expire bientôt.";
}
