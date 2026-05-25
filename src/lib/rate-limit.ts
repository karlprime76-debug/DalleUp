type ClientEntry = {
  count: number;
  resetAt: number;
};

const clients = new Map<string, ClientEntry>();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

const LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  "/api/register": { windowMs: 60_000, maxRequests: 3 },
  "/api/auth/forgot-password": { windowMs: 60_000, maxRequests: 3 },
  "/api/auth/reset-password": { windowMs: 60_000, maxRequests: 5 },
  "/api/login": { windowMs: 60_000, maxRequests: 5 },
  "/api/admin": { windowMs: 60_000, maxRequests: 30 },
};

function getKey(ip: string, path: string) {
  return `${ip}:${path}`;
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of clients) {
    if (entry.resetAt <= now) clients.delete(key);
  }
}

setInterval(cleanup, 60_000);

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function rateLimit(ip: string, path: string): { ok: boolean; retryAfter?: number } {
  const key = getKey(ip, path);
  const now = Date.now();

  const limit = LIMITS[path] ?? { windowMs: DEFAULT_WINDOW_MS, maxRequests: DEFAULT_MAX_REQUESTS };
  const entry = clients.get(key);

  if (!entry || entry.resetAt <= now) {
    clients.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { ok: true };
  }

  if (entry.count >= limit.maxRequests) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true };
}

export function rateLimitRequest(request: Request, path: string): { ok: boolean; retryAfter?: number } {
  const ip = getClientIp(request);
  return rateLimit(ip, path);
}
