import { createClient } from "./client";
import { createServerClient } from "./server";
import { getDocumentExpiryDate, getResidenceProofLifecycleStatus } from "@/lib/verification/expiry";

export const VERIFICATION_DOCUMENTS_BUCKET = "verification-documents";
export const SIGNED_CONTRACTS_BUCKET = "signed-contracts";

export type VerificationRole = "RESTAURANT" | "DELIVERY_DRIVER";
export type VerificationStatus = "PENDING_DOCUMENTS" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type VerificationDocumentStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type VerificationDocument = {
  type: string;
  path: string;
  uploadedAt: string;
  status?: VerificationDocumentStatus;
  reviewedAt?: string;
  reviewedById?: string;
  expiresAt?: string;
  rejectionReason?: string;
};

export type VerificationManifest = {
  role: VerificationRole;
  status: VerificationStatus;
  documents: VerificationDocument[];
  contractSigned: boolean;
  contractPath?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedById?: string;
  rejectionReason?: string;
};

export type StorageActionResult = { error?: string };
export type UploadPathResult = { path: string; error?: string };
export type SignedUrlResult = { url?: string; error?: string };

export const PROOF_OF_RESIDENCE_DOCUMENT_TYPE = "PROOF_OF_RESIDENCE";

export const ACCEPTED_RESIDENCE_PROOF_DOCUMENTS = [
  "Facture SBEE",
  "Facture SONEB",
  "Facture internet",
  "Attestation de résidence",
  "Contrat de location",
  "Quittance de loyer",
  "Certificat de résidence",
  "Autre document validé par l’admin",
];

function manifestPath(userId: string) {
  return `${userId}/manifest.json`;
}

function fileExtension(fileName: string) {
  return fileName.split(".").pop() || "pdf";
}

function createDefaultManifest(role: VerificationRole): VerificationManifest {
  return {
    role,
    status: "PENDING_DOCUMENTS",
    documents: [],
    contractSigned: false,
  };
}

export function getRequiredDocuments(role: VerificationRole): string[] {
  if (role === "RESTAURANT") return ["ID_CARD", "RESTAURANT_PHOTOS", "MOBILE_MONEY", PROOF_OF_RESIDENCE_DOCUMENT_TYPE];
  return ["ID_CARD", "PROFILE_PHOTO", "SELFIE", "MOBILE_MONEY", PROOF_OF_RESIDENCE_DOCUMENT_TYPE];
}

export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ID_CARD: "Pièce d'identité",
    CIP_NPI: "CIP / NPI",
    RCCM: "RCCM",
    IFU: "IFU",
    RESTAURANT_PHOTOS: "Photos du restaurant",
    LOGO: "Logo",
    COVER: "Photo de couverture",
    MOBILE_MONEY: "Numéro Mobile Money",
    PROFILE_PHOTO: "Photo de profil",
    SELFIE: "Selfie de vérification",
    VEHICLE_DOC: "Document véhicule",
    LICENSE: "Permis",
    EMERGENCY_CONTACT: "Contact d'urgence",
    DELIVERY_ZONE: "Zone de livraison",
    PROOF_OF_RESIDENCE: "Preuve de résidence",
  };
  return labels[type] ?? type;
}

export function getDocumentTypeDescription(type: string): string {
  if (type === PROOF_OF_RESIDENCE_DOCUMENT_TYPE) {
    return "Facture récente, attestation de résidence, contrat de location ou autre document prouvant votre adresse.";
  }
  return "";
}

export function isVerificationComplete(manifest: VerificationManifest | null, role: VerificationRole): boolean {
  if (!manifest || !manifest.contractSigned) return false;
  const uploadedTypes = new Set(manifest.documents.map((document) => document.type));
  return getRequiredDocuments(role).every((type) => uploadedTypes.has(type));
}

export async function getVerificationManifest(userId: string): Promise<VerificationManifest | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
      .download(manifestPath(userId));

    if (error || !data) return null;
    return JSON.parse(await data.text()) as VerificationManifest;
  } catch {
    return null;
  }
}

export async function saveVerificationManifest(userId: string, manifest: VerificationManifest): Promise<StorageActionResult> {
  try {
    const supabase = createServerClient();
    const file = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const { error } = await supabase.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
      .upload(manifestPath(userId), file, { upsert: true, contentType: "application/json" });

    if (error) return { error: error.message };
    return {};
  } catch {
    return { error: "Impossible d'enregistrer le dossier de vérification." };
  }
}

export async function ensureVerificationManifest(userId: string, role: VerificationRole): Promise<VerificationManifest> {
  const existing = await getVerificationManifest(userId);
  if (existing) return existing;

  const manifest = createDefaultManifest(role);
  await saveVerificationManifest(userId, manifest);
  return manifest;
}

export async function uploadVerificationDocument(userId: string, role: VerificationRole, type: string, file: File): Promise<UploadPathResult> {
  try {
    await ensureVerificationManifest(userId, role);
    const supabase = createClient();
    const path = verificationDocumentPath(userId, role, type, file.name);
    const { error } = await supabase.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type || undefined });

    if (error) return { path: "", error: error.message };

    const manifest = await ensureVerificationManifest(userId, role);
    manifest.documents = manifest.documents.filter((document) => document.type !== type);
    manifest.documents.push({ type, path, uploadedAt: new Date().toISOString(), status: "PENDING_REVIEW" });
    manifest.status = "PENDING_DOCUMENTS";
    await saveVerificationManifest(userId, manifest);

    return { path };
  } catch {
    return { path: "", error: "Impossible d'envoyer le document." };
  }
}

export async function uploadSignedContract(userId: string, role: VerificationRole, file: File): Promise<UploadPathResult> {
  try {
    await ensureVerificationManifest(userId, role);
    const supabase = createClient();
    const path = `${userId}/contract-${Date.now()}.${fileExtension(file.name)}`;
    const { error } = await supabase.storage
      .from(SIGNED_CONTRACTS_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type || undefined });

    if (error) return { path: "", error: error.message };

    const manifest = await ensureVerificationManifest(userId, role);
    manifest.contractSigned = true;
    manifest.contractPath = path;
    manifest.status = "PENDING_DOCUMENTS";
    await saveVerificationManifest(userId, manifest);

    return { path };
  } catch {
    return { path: "", error: "Impossible d'envoyer le contrat signé." };
  }
}

export async function submitVerificationForReview(userId: string, role: VerificationRole): Promise<StorageActionResult> {
  const manifest = await ensureVerificationManifest(userId, role);
  const uploadedTypes = new Set(manifest.documents.map((document) => document.type));
  const missingTypes = getRequiredDocuments(role).filter((type) => !uploadedTypes.has(type));

  if (missingTypes.length > 0) {
    return { error: `Documents manquants : ${missingTypes.map(getDocumentTypeLabel).join(", ")}` };
  }

  if (!manifest.contractSigned) return { error: "Le contrat signé est requis." };

  manifest.status = "PENDING_REVIEW";
  manifest.submittedAt = new Date().toISOString();
  manifest.rejectionReason = undefined;
  return saveVerificationManifest(userId, manifest);
}

export async function approveVerification(userId: string, adminId: string): Promise<StorageActionResult> {
  return updateVerificationStatus(userId, "APPROVED", adminId);
}

export async function rejectVerification(userId: string, adminId: string, reason: string): Promise<StorageActionResult> {
  return updateVerificationStatus(userId, "REJECTED", adminId, reason);
}

export async function approveVerificationDocument(userId: string, type: string, adminId: string): Promise<StorageActionResult> {
  const manifest = await getVerificationManifest(userId);
  if (!manifest) return { error: "Dossier de vérification introuvable." };

  const document = manifest.documents.find((item) => item.type === type);
  if (!document) return { error: "Document introuvable." };

  const reviewedAt = new Date().toISOString();
  document.status = "APPROVED";
  document.reviewedAt = reviewedAt;
  document.reviewedById = adminId;
  document.rejectionReason = undefined;
  if (type === PROOF_OF_RESIDENCE_DOCUMENT_TYPE) document.expiresAt = getDocumentExpiryDate(reviewedAt).toISOString();

  return saveVerificationManifest(userId, manifest);
}

export async function rejectVerificationDocument(userId: string, type: string, adminId: string, reason: string): Promise<StorageActionResult> {
  if (!reason.trim()) return { error: "La raison du rejet est obligatoire." };

  const manifest = await getVerificationManifest(userId);
  if (!manifest) return { error: "Dossier de vérification introuvable." };

  const document = manifest.documents.find((item) => item.type === type);
  if (!document) return { error: "Document introuvable." };

  document.status = "REJECTED";
  document.reviewedAt = new Date().toISOString();
  document.reviewedById = adminId;
  document.expiresAt = undefined;
  document.rejectionReason = reason;
  manifest.status = "PENDING_DOCUMENTS";

  return saveVerificationManifest(userId, manifest);
}

export async function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
  reviewedById?: string,
  rejectionReason?: string
): Promise<StorageActionResult> {
  const manifest = await getVerificationManifest(userId);
  if (!manifest) return { error: "Dossier de vérification introuvable." };

  manifest.status = status;
  manifest.reviewedAt = new Date().toISOString();
  manifest.reviewedById = reviewedById;
  manifest.rejectionReason = rejectionReason;
  return saveVerificationManifest(userId, manifest);
}

export async function getVerificationStatus(userId: string, role: VerificationRole) {
  const manifest = await getVerificationManifest(userId);
  const requiredTypes = getRequiredDocuments(role);
  const uploadedTypes = new Set(manifest?.documents.map((document) => document.type) ?? []);
  const documents = requiredTypes.map((type) => ({
    type,
    label: getDocumentTypeLabel(type),
    description: getDocumentTypeDescription(type),
    uploaded: uploadedTypes.has(type),
  }));
  const isComplete = isVerificationComplete(manifest, role);
  const residenceProof = getResidenceProofStatus(manifest);

  return {
    status: manifest?.status ?? "PENDING_DOCUMENTS",
    documents,
    contractSigned: manifest?.contractSigned ?? false,
    isComplete,
    canSubmit: isComplete && (manifest?.status ?? "PENDING_DOCUMENTS") === "PENDING_DOCUMENTS",
    residenceProof,
    submittedAt: manifest?.submittedAt,
    reviewedAt: manifest?.reviewedAt,
    rejectionReason: manifest?.rejectionReason,
  };
}

export async function createDocumentSignedUrl(path: string): Promise<SignedUrlResult> {
  return createSignedUrl(VERIFICATION_DOCUMENTS_BUCKET, path);
}

export async function createContractSignedUrl(path: string): Promise<SignedUrlResult> {
  return createSignedUrl(SIGNED_CONTRACTS_BUCKET, path);
}

async function createSignedUrl(bucket: string, path: string): Promise<SignedUrlResult> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 15 * 60);
    if (error) return { error: error.message };
    return { url: data.signedUrl };
  } catch {
    return { error: "Impossible de générer l'URL sécurisée." };
  }
}

export async function getVerificationDetail(userId: string) {
  const manifest = await getVerificationManifest(userId);
  if (!manifest) return null;

  const documents = await Promise.all(
    manifest.documents.map(async (document) => {
      const signedUrl = await createDocumentSignedUrl(document.path);
      return {
        ...document,
        label: getDocumentTypeLabel(document.type),
        description: getDocumentTypeDescription(document.type),
        lifecycleStatus: document.type === PROOF_OF_RESIDENCE_DOCUMENT_TYPE ? getResidenceProofLifecycleStatus(document) : undefined,
        url: signedUrl.url,
      };
    })
  );

  const contractUrl = manifest.contractPath ? (await createContractSignedUrl(manifest.contractPath)).url : undefined;
  const requiredTypes = getRequiredDocuments(manifest.role);
  const uploadedTypes = new Set(manifest.documents.map((document) => document.type));

  return {
    manifest,
    documents,
    contractUrl,
    missingDocuments: requiredTypes
      .filter((type) => !uploadedTypes.has(type))
      .map((type) => ({ type, label: getDocumentTypeLabel(type) })),
  };
}

export async function listVerificationManifests(): Promise<{ userId: string; manifest: VerificationManifest }[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.storage.from(VERIFICATION_DOCUMENTS_BUCKET).list("", { limit: 1000 });
    if (error || !data) return [];

    const results: { userId: string; manifest: VerificationManifest }[] = [];
    for (const item of data) {
      const manifest = await getVerificationManifest(item.name);
      if (manifest) results.push({ userId: item.name, manifest });
    }
    return results;
  } catch {
    return [];
  }
}

export async function listPendingVerifications() {
  const manifests = await listVerificationManifests();
  return manifests.filter(({ manifest }) => manifest.status === "PENDING_REVIEW" || manifest.status === "PENDING_DOCUMENTS");
}

export async function listVerificationsByStatus(status: VerificationStatus) {
  const manifests = await listVerificationManifests();
  return manifests.filter(({ manifest }) => manifest.status === status);
}

export function getContractDownloadUrl(role: "restaurant" | "driver") {
  return `/contracts/${role}-contract.pdf`;
}

function verificationDocumentPath(userId: string, role: VerificationRole, type: string, fileName: string) {
  if (type === PROOF_OF_RESIDENCE_DOCUMENT_TYPE) {
    const segment = role === "RESTAURANT" ? "restaurants" : "drivers";
    return `${segment}/${userId}/proof-of-residence/${Date.now()}-${fileName}`;
  }
  return `users/${userId}/${type}/${Date.now()}-${fileName}`;
}

export function getResidenceProofStatus(manifest: VerificationManifest | null) {
  const document = manifest?.documents.find((item) => item.type === PROOF_OF_RESIDENCE_DOCUMENT_TYPE);
  return {
    document,
    lifecycleStatus: getResidenceProofLifecycleStatus({
      status: document?.status,
      expiresAt: document?.expiresAt,
    }),
    acceptedDocuments: ACCEPTED_RESIDENCE_PROOF_DOCUMENTS,
    label: getDocumentTypeLabel(PROOF_OF_RESIDENCE_DOCUMENT_TYPE),
    description: getDocumentTypeDescription(PROOF_OF_RESIDENCE_DOCUMENT_TYPE),
  };
}
