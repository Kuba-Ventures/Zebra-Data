import "server-only";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Sets the PHI encryption key on the current Postgres session.
 * Must be called before any insert/select that touches encrypted columns,
 * because zebra_phi_encrypt/decrypt read from `app.phi_key`.
 *
 * Uses set_config(...) so the value lives only for this transaction/session.
 */
export async function withPhiKey<T>(fn: () => Promise<T>): Promise<T> {
  const key = process.env.PHI_ENCRYPTION_KEY;
  if (!key) throw new Error("PHI_ENCRYPTION_KEY is not set");
  await db.execute(sql`select set_config('app.phi_key', ${key}, false)`);
  try {
    return await fn();
  } finally {
    await db.execute(sql`select set_config('app.phi_key', '', false)`);
  }
}

/** SQL fragment to encrypt a plaintext value at insert time. */
export function encryptSql(plaintext: string | null | undefined) {
  if (plaintext === null || plaintext === undefined || plaintext === "") {
    return sql`null::bytea`;
  }
  return sql`zebra_phi_encrypt(${plaintext})`;
}

/** SQL fragment to decrypt a bytea column. Use inside a select. */
export function decryptSql(column: string) {
  return sql.raw(`zebra_phi_decrypt(${column}) as ${column}_plain`);
}
