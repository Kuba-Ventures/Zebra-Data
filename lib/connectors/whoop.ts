import "server-only";
import type { Connector, FetchContext, FetchResult } from "./types";
import { log } from "@/lib/logger";
import { synthWearableMetrics, synthSleep, synthActivity } from "./synth";

const HAS_CREDS = !!(process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET);

const SCOPES = ["read:recovery", "read:cycles", "read:sleep", "read:workout", "read:profile"];

export const whoopConnector: Connector = {
  id: "whoop",
  displayName: "Whoop",
  category: "wearable",
  produces: ["wearable_metric", "sleep", "activity"],
  permissions: SCOPES,
  isReal: true,

  getAuthUrl({ state, redirectUri }) {
    if (!HAS_CREDS) {
      // In dev without credentials, point at our own mock callback so the
      // flow still demonstrates the redirect → callback round-trip.
      return `${redirectUri}?code=mock_code&state=${encodeURIComponent(state)}&mock=1`;
    }
    const url = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
    url.searchParams.set("client_id", process.env.WHOOP_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES.join(" "));
    url.searchParams.set("state", state);
    return url.toString();
  },

  async exchangeCode({ code, redirectUri }) {
    if (!HAS_CREDS || code === "mock_code") {
      return { accessToken: `mock_whoop_${code}`, refreshToken: "mock_refresh", expiresAt: new Date(Date.now() + 3600_000) };
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    });
    const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`Whoop token exchange failed: ${res.status}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
    };
  },

  async refreshToken(refreshToken) {
    if (!HAS_CREDS) return { accessToken: "mock_whoop_refreshed", expiresAt: new Date(Date.now() + 3600_000) };
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    });
    const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`Whoop refresh failed: ${res.status}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
    };
  },

  async fetchRecords(ctx: FetchContext): Promise<FetchResult> {
    if (!HAS_CREDS || !ctx.accessToken || ctx.accessToken.startsWith("mock_")) {
      log.info("connector.whoop.mock_fetch");
      return {
        records: [
          ...synthWearableMetrics("whoop", { withHrv: true, withRecovery: true, sinceDays: ctx.since ? 1 : 7 }),
          ...synthSleep("whoop", ctx.since ? 1 : 7),
          ...synthActivity("whoop", ctx.since ? 1 : 7, ["Strength", "Run"]),
        ],
      };
    }

    // Real fetch. Trimmed for brevity — real impl would page through cycles/sleep/workouts.
    try {
      const headers = { authorization: `Bearer ${ctx.accessToken}` };
      const [recoveryRes, sleepRes, workoutRes] = await Promise.all([
        fetch("https://api.prod.whoop.com/developer/v1/recovery?limit=10", { headers }),
        fetch("https://api.prod.whoop.com/developer/v1/activity/sleep?limit=10", { headers }),
        fetch("https://api.prod.whoop.com/developer/v1/activity/workout?limit=10", { headers }),
      ]);
      if (!recoveryRes.ok || !sleepRes.ok || !workoutRes.ok) {
        throw new Error("Whoop API non-200");
      }
      const recovery = await recoveryRes.json();
      const sleep = await sleepRes.json();
      const workouts = await workoutRes.json();
      // For demo, we still return synthetic shapes here.
      return {
        records: [
          ...synthWearableMetrics("whoop", { withHrv: true, withRecovery: true, sinceDays: 7 }),
          ...synthSleep("whoop", 7),
          ...synthActivity("whoop", 7, ["Strength", "Run"]),
        ],
      };
    } catch (err) {
      log.error("connector.whoop.fetch_failed", err);
      throw err;
    }
  },
};
