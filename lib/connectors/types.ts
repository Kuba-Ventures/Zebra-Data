/**
 * Connector interface. Every source - real or mock - implements this.
 * See CONNECTORS.md for how to add a new one.
 */
import type { recordType } from "@/lib/db/schema";

export type RecordTypeName = (typeof recordType.enumValues)[number];

/** A single record produced by a connector during a sync. */
export type ConnectorRecord = {
  recordType: RecordTypeName;
  externalId?: string;
  /** Source-shape payload. Connector decides the shape; stored as jsonb. */
  payload: Record<string, unknown>;
  /** When the data was generated (lab drawn at, workout completed at, etc.). */
  effectiveDate?: Date;
  /** Optional human-readable source attribution. */
  sourceAttribution?: Record<string, unknown>;
};

export type FetchContext = {
  /** Decrypted access token, or null in mock mode. */
  accessToken: string | null;
  /** When the connection last synced - fetch only newer data when possible. */
  since: Date | null;
  /** Connection-level external account ID (e.g. Whoop user id). */
  externalAccountId?: string | null;
};

export type FetchResult = {
  records: ConnectorRecord[];
  /** Optional updated tokens if the connector refreshed during fetch. */
  newAccessToken?: string;
  newRefreshToken?: string;
  newExpiresAt?: Date;
  /** Optional external account id captured during this fetch. */
  externalAccountId?: string;
};

export type Connector = {
  /** Stable identifier, e.g. 'whoop', 'oura', 'mychart:vcu'. */
  id: string;
  /** Display name. */
  displayName: string;
  /** Logical category for grouping in the connections UI. */
  category: ConnectorCategory;
  /** What kinds of data this connector emits. */
  produces: RecordTypeName[];
  /** OAuth scopes / permissions, human-readable. */
  permissions: string[];

  /** Whether this connector has real OAuth wired up. If false, it's mock-only. */
  isReal: boolean;

  /** Build the authorization URL to send the user to. */
  getAuthUrl(opts: { state: string; redirectUri: string }): string;

  /** Exchange an authorization code for tokens. Mock connectors return synthetic tokens. */
  exchangeCode(opts: { code: string; redirectUri: string }): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    externalAccountId?: string;
  }>;

  /** Refresh an expired access token. */
  refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }>;

  /** Fetch new records since the last sync. */
  fetchRecords(ctx: FetchContext): Promise<FetchResult>;
};

export type ConnectorCategory =
  | "ehr"
  | "wearable"
  | "fitness"
  | "lab"
  | "pharmacy"
  | "mental";

export const CATEGORY_LABEL: Record<ConnectorCategory, string> = {
  ehr:      "Health Systems & EMRs",
  wearable: "Wearables",
  fitness:  "Fitness & Nutrition",
  lab:      "Labs & Diagnostics",
  pharmacy: "Pharmacy",
  mental:   "Mental Health & Sleep",
};
