# Connectors

A **connector** is a small module that knows how to talk to one data source —
Whoop, Oura, MyChart, Strava — and emit `ConnectorRecord` objects that the
rest of Zebra can ingest.

Everything plugs in through one interface: `lib/connectors/types.ts → Connector`.

```ts
type Connector = {
  id: string;                     // 'whoop', 'oura', 'mychart'
  displayName: string;
  category: ConnectorCategory;
  produces: RecordTypeName[];     // which dashboard cards this feeds
  permissions: string[];
  isReal: boolean;                // true = goes through real OAuth, false = mock-only

  getAuthUrl(opts):  string;
  exchangeCode(opts): Promise<{ accessToken, refreshToken?, expiresAt?, externalAccountId? }>;
  refreshToken(rt):   Promise<{ accessToken, refreshToken?, expiresAt? }>;
  fetchRecords(ctx):  Promise<{ records: ConnectorRecord[], newAccessToken?, ... }>;
};
```

The sync runner (`lib/sync/runner.ts`) calls these methods. It doesn't care
whether your connector hits a real API or returns synthesized data — same
contract.

---

## What ships out of the box

| Source | Real OAuth? | Real data? | Where |
|---|---|---|---|
| Whoop | ✅ Yes (when `WHOOP_CLIENT_*` env vars set) | ✅ Yes, with creds. Falls back to mock without. | `lib/connectors/whoop.ts` |
| Oura | ✅ Yes (when `OURA_CLIENT_*` set) | ✅ Yes, with creds. Mock fallback. | `lib/connectors/oura.ts` |
| MyChart (Epic) | Round-trips through our own callback (no real Epic creds yet) | ❌ Synthesized | `lib/connectors/mychart.ts` |
| Everything else (Cerner, athenahealth, Quest, CVS, Strava, Headspace, …) | "Demo connect" — instant link, no redirect | ❌ Synthesized | `lib/connectors/mock.ts` (generic) |

The synthetic data generator is shared and lives in `lib/connectors/synth.ts`.
It produces realistic-looking shapes for every record type the dashboard cares
about (vitals, labs, meds, allergies, conditions, visits, imaging, wearable
metrics, sleep, activity, nutrition, mental_health).

---

## Adding a new real integration

Suppose you want to wire up Fitbit.

### 1. Implement the connector

Create `lib/connectors/fitbit.ts`:

```ts
import "server-only";
import type { Connector, FetchContext, FetchResult } from "./types";
import { synthActivity, synthSleep } from "./synth";

const HAS_CREDS = !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET);
const SCOPES = ["activity", "heartrate", "sleep", "profile"];

export const fitbitConnector: Connector = {
  id: "fitbit",
  displayName: "Fitbit",
  category: "wearable",
  produces: ["wearable_metric", "activity", "sleep"],
  permissions: SCOPES,
  isReal: true,

  getAuthUrl({ state, redirectUri }) {
    if (!HAS_CREDS) return `${redirectUri}?code=mock_code&state=${encodeURIComponent(state)}&mock=1`;
    const u = new URL("https://www.fitbit.com/oauth2/authorize");
    u.searchParams.set("client_id", process.env.FITBIT_CLIENT_ID!);
    u.searchParams.set("redirect_uri", redirectUri);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("scope", SCOPES.join(" "));
    u.searchParams.set("state", state);
    return u.toString();
  },

  async exchangeCode({ code, redirectUri }) {
    if (!HAS_CREDS || code === "mock_code") {
      return { accessToken: `mock_fitbit_${code}`, expiresAt: new Date(Date.now() + 3600_000) };
    }
    // POST to https://api.fitbit.com/oauth2/token with Basic auth …
    // return tokens
  },

  async refreshToken(refreshToken) { /* … */ },

  async fetchRecords(ctx: FetchContext): Promise<FetchResult> {
    if (!HAS_CREDS || !ctx.accessToken || ctx.accessToken.startsWith("mock_")) {
      return {
        records: [
          ...synthActivity("fitbit", 7, ["Walk", "Run"]),
          ...synthSleep("fitbit", 7),
        ],
      };
    }
    // Real fetch: GET https://api.fitbit.com/1/user/-/activities/date/today.json …
    // map response → ConnectorRecord[]
  },
};
```

### 2. Register it

`lib/connectors/registry.ts`:

```ts
import { fitbitConnector } from "./fitbit";

_registry = {
  whoop: whoopConnector,
  oura:  ouraConnector,
  mychart: mychartConnector,
  fitbit: fitbitConnector,  // ← here
};
```

And `lib/connectors/registry-meta.ts`:

```ts
export const CONNECTOR_IDS = new Set(["whoop", "oura", "mychart", "fitbit"]);
```

### 3. Update the catalog (if needed)

`lib/connectors/catalog.ts` already has a `fitbit` entry; if it didn't, add
one with the brand color, description, and which `recordType`s it feeds.

### 4. Add env vars

```bash
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
```

Add the same vars to `.env.example` and to Vercel for production.

### 5. Done

The Connections page will render Fitbit with a real **Connect** button
(instead of "Try demo connect"), the callback at
`/api/connections/fitbit/callback` works without further wiring, and
the daily cron picks it up automatically.

---

## Mapping FHIR to ConnectorRecord (for EMR integrations)

When you swap the mock MyChart for real Epic FHIR, you'll map FHIR resources
to `ConnectorRecord`s like this:

| FHIR resource | `recordType` | Notes |
|---|---|---|
| `Observation` (category: vital-signs) | `vital` | `payload.kind` from LOINC code |
| `Observation` (category: laboratory)  | `lab`   | `payload.name` = display name, value + unit from valueQuantity |
| `MedicationRequest` / `MedicationStatement` | `medication` | `payload.active` from status |
| `AllergyIntolerance` | `allergy` | `payload.severity` from criticality |
| `Condition` | `condition` | clinicalStatus filter for active |
| `Encounter` | `visit` | summary from linked `DocumentReference` |
| `DiagnosticReport` (imaging) | `imaging` | `payload.modality`, body site |

The grouping keys in `lib/resolver/index.ts` are already shaped for this
mapping — no resolver changes needed.

---

## Survivorship

When two sources produce the same logical fact (same blood pressure on the
same day, same allergy name), the resolver decides what to do based on the
policy in `lib/resolver/survivorship.ts`:

- **`most_recent`** — vitals, wearable metrics: replace if newer.
- **`preserve_history`** — labs, visits, imaging, activity, sleep, nutrition,
  mental health: keep every row. (Trends matter.)
- **`flag_conflict`** — allergies, medications, conditions: never silently
  merge. Raise a `conflicts` row when sources disagree.

To change policy for a record type, edit the map in `survivorship.ts`. No
resolver changes required.
