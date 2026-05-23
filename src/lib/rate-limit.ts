type ClientEntry = {
  count: number;
  resetAt: number;
};

const clients = new Map<string, ClientEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

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

export function rateLimit(ip: string, path: string): { ok: boolean; retryAfter?: number } {
  const key = getKey(ip, path);
  const now = Date.now();
  const entry = clients.get(key);

  if (!entry || entry.resetAt <= now) {
    clients.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true };
}
