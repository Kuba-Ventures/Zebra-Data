// Pure demo-mode helpers - no Next imports so this is safe to use from
// middleware (Edge runtime) as well as Server Components / Route Handlers.

export const DEMO_COOKIE = "zebra_demo_user";

export type DemoUser = { id: string; email: string; isDemo: true };

// Stable UUID-v4-shape id derived from the email so DB reads/writes
// for the same demo email map to the same synthetic user across requests.
export function demoUserIdFromEmail(email: string): string {
  let h1 = 0x811c9dc5 >>> 0;
  for (let i = 0; i < email.length; i++) {
    h1 ^= email.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  let h2 = 0xdeadbeef >>> 0;
  for (let i = 0; i < email.length; i++) {
    h2 = Math.imul(h2 ^ email.charCodeAt(i), 0x85ebca6b) >>> 0;
  }
  const a = h1.toString(16).padStart(8, "0");
  const b = h2.toString(16).padStart(8, "0");
  return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${a.slice(0, 3)}-${a}${b.slice(0, 4)}`;
}

export function parseDemoCookieValue(value: string | undefined | null): DemoUser | null {
  if (!value) return null;
  let email: string;
  try {
    email = decodeURIComponent(value).trim().toLowerCase();
  } catch {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { id: demoUserIdFromEmail(email), email, isDemo: true };
}
