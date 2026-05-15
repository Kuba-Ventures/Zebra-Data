import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  // Allowed during build/typecheck - error surfaces at first runtime call.
  console.warn("[db] DATABASE_URL not set. Drizzle will fail at runtime.");
}

declare global {
  // eslint-disable-next-line no-var
  var __zebraSql: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__zebraSql ??
  postgres(url ?? "postgres://invalid", {
    max: 5,
    idle_timeout: 20,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalThis.__zebraSql = client;

export const db = drizzle(client, { schema });
export { schema };
