export function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

export function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String(error.code);
  }
  return null;
}

export function sanitizeErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  return error.message
    .split("\n")
    .map((line) =>
      line
        .replace(/postgresql:\/\/[^\s]+/gi, "[redacted-url]")
        .replace(/postgres:\/\/[^\s]+/gi, "[redacted-url]")
        .replace(/@[\w\-.]+\.supabase\.co/gi, "[redacted-host]")
        .replace(/@[\w\-.]+\.aws/gi, "[redacted-host]")
        .replace(/password=[^\s&]+/gi, "password=[redacted]")
        .trim()
    )
    .find((line) => line && !line.startsWith("Invalid `")) ?? null;
}
