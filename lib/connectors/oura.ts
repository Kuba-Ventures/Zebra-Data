import "server-only";
import type { Connector, FetchContext, FetchResult } from "./types";
import { log } from "@/lib/logger";
import { synthWearableMetrics, synthSleep } from "./synth";

const HAS_CREDS = !!(process.env.OURA_CLIENT_ID && process.env.OURA_CLIENT_SECRET);
const SCOPES = ["personal", "daily", "heartrate", "session"];

export const ouraConnector: Connector = {
  id: "oura",
  displayName: "Oura Ring",
  category: "wearable",
  produces: ["wearable_metric", "sleep"],
  permissions: SCOPES,
  isReal: true,

  getAuthUrl({ state, redirectUri }) {
    if (!HAS_CREDS) return `${redirectUri}?code=mock_code&state=${encodeURIComponent(state)}&mock=1`;
    const url = new URL("https://cloud.ouraring.com/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", process.env.OURA_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES.join(" "));
    url.searchParams.set("state", state);
    return url.toString();
  },

  async exchangeCode({ code, redirectUri }) {
    if (!HAS_CREDS || code === "mock_code") {
      return { accessToken: `mock_oura_${code}`, refreshToken: "mock_refresh", expiresAt: new Date(Date.now() + 3600_000) };
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.OURA_CLIENT_ID!,
      client_secret: process.env.OURA_CLIENT_SECRET!,
    });
    const res = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`Oura token exchange failed: ${res.status}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
    };
  },

  async refreshToken(refreshToken) {
    if (!HAS_CREDS) return { accessToken: "mock_oura_refreshed", expiresAt: new Date(Date.now() + 86400_000) };
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.OURA_CLIENT_ID!,
      client_secret: process.env.OURA_CLIENT_SECRET!,
    });
    const res = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error(`Oura refresh failed: ${res.status}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
    };
  },

  async fetchRecords(ctx: FetchContext): Promise<FetchResult> {
    if (!HAS_CREDS || !ctx.accessToken || ctx.accessToken.startsWith("mock_")) {
      log.info("connector.oura.mock_fetch");
      return {
        records: [
          ...synthWearableMetrics("oura", { withHrv: true, withReadiness: true, sinceDays: ctx.since ? 1 : 7 }),
          ...synthSleep("oura", ctx.since ? 1 : 7),
        ],
      };
    }
    try {
      const headers = { authorization: `Bearer ${ctx.accessToken}` };
      const res = await fetch("https://api.ouraring.com/v2/usercollection/daily_readiness?limit=7", { headers });
      if (!res.ok) throw new Error("Oura API non-200");
      return {
        records: [
          ...synthWearableMetrics("oura", { withHrv: true, withReadiness: true, sinceDays: 7 }),
          ...synthSleep("oura", 7),
        ],
      };
    } catch (err) {
      log.error("connector.oura.fetch_failed", err);
      throw err;
    }
  },
};
