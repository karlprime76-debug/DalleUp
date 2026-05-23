import { rateLimit } from "./rate-limit";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}

test("rate limit allows first requests", () => {
  const ip = "1.2.3.4";
  for (let i = 0; i < 10; i++) {
    const result = rateLimit(ip, "/test");
    assert(result.ok, `request ${i + 1} should be allowed`);
  }
});

test("rate limit blocks after 10 requests", () => {
  const ip = "5.6.7.8";
  for (let i = 0; i < 10; i++) rateLimit(ip, "/test");
  const result = rateLimit(ip, "/test");
  assert(!result.ok, "11th request should be blocked");
  assert(typeof result.retryAfter === "number" && result.retryAfter > 0, "retryAfter should be positive");
});

test("rate limit tracks different paths separately", () => {
  const ip = "9.10.11.12";
  for (let i = 0; i < 10; i++) rateLimit(ip, "/a");
  const b = rateLimit(ip, "/b");
  assert(b.ok, "different path should have its own counter");
});

console.log("Rate limit tests done.");
