import "server-only";
import { db } from "@/lib/db";
import {
  connections, rawRecords as rawTable, syncJobs, patientProfiles,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { resolveConnectorBySourceId } from "@/lib/connectors/registry";
import { withPhiKey } from "@/lib/crypto";
import { resolveRecordsForPatient } from "@/lib/resolver";
import { log } from "@/lib/logger";

/**
 * Run a sync for a single connection:
 *   1) decrypt token (if any)
 *   2) refresh token if expired
 *   3) call connector.fetchRecords
 *   4) write raw_records
 *   5) push through resolver → unified_records (+ conflicts)
 *   6) update connection.last_sync_*, sync_jobs row
 */
export async function runSyncForConnection(connectionId: string): Promise<{ ok: boolean; ingested: number; conflicts: number; error?: string }> {
  const [conn] = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1);
  if (!conn) return { ok: false, ingested: 0, conflicts: 0, error: "Connection not found" };
  if (conn.status === "disconnected") {
    return { ok: false, ingested: 0, conflicts: 0, error: "Disconnected" };
  }

  await db.update(connections).set({ status: "syncing" }).where(eq(connections.id, connectionId));

  const [job] = await db.insert(syncJobs).values({
    connectionId,
    status: "running",
  }).returning({ id: syncJobs.id });

  try {
    const connector = resolveConnectorBySourceId(conn.sourceId);

    // Decrypt access token if present, otherwise pass null (mock mode).
    let accessToken: string | null = null;
    if (conn.accessTokenEncrypted) {
      const rows = await withPhiKey(async () => {
        return await db.execute<{ at: string }>(sql`
          select zebra_phi_decrypt(${conn.accessTokenEncrypted}::bytea) as at
        `);
      });
      accessToken = rows[0]?.at ?? null;
    }

    // Token refresh
    if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt) < new Date() && conn.refreshTokenEncrypted) {
      const rows = await withPhiKey(async () => {
        return await db.execute<{ rt: string }>(sql`
          select zebra_phi_decrypt(${conn.refreshTokenEncrypted}::bytea) as rt
        `);
      });
      const rt = rows[0]?.rt;
      if (rt) {
        const refreshed = await connector.refreshToken(rt);
        accessToken = refreshed.accessToken;
        await withPhiKey(async () => {
          await db.execute(sql`
            update connections set
              access_token_encrypted = zebra_phi_encrypt(${refreshed.accessToken}),
              refresh_token_encrypted = ${refreshed.refreshToken ? sql`zebra_phi_encrypt(${refreshed.refreshToken})` : sql`refresh_token_encrypted`},
              token_expires_at = ${refreshed.expiresAt?.toISOString() ?? null}
            where id = ${connectionId}::uuid
          `);
        });
      }
    }

    const result = await connector.fetchRecords({
      accessToken,
      since: conn.lastSyncAt ? new Date(conn.lastSyncAt) : null,
      externalAccountId: conn.externalAccountId,
    });

    // Token rotation if connector returned new ones during fetch.
    if (result.newAccessToken) {
      await withPhiKey(async () => {
        await db.execute(sql`
          update connections set
            access_token_encrypted = zebra_phi_encrypt(${result.newAccessToken}),
            refresh_token_encrypted = ${result.newRefreshToken ? sql`zebra_phi_encrypt(${result.newRefreshToken})` : sql`refresh_token_encrypted`},
            token_expires_at = ${result.newExpiresAt?.toISOString() ?? null}
          where id = ${connectionId}::uuid
        `);
      });
    }

    // Insert raw records
    const inserted = result.records.length
      ? await db.insert(rawTable).values(
          result.records.map((r) => ({
            userId: conn.userId,
            connectionId: conn.id,
            sourceId: conn.sourceId,
            recordType: r.recordType,
            externalId: r.externalId ?? null,
            payload: r.payload,
            effectiveDate: r.effectiveDate ?? null,
            sourceAttribution: r.sourceAttribution ?? null,
          })),
        ).returning({ id: rawTable.id })
      : [];

    // Resolve into unified
    const resolveSummary = await resolveRecordsForPatient({
      patientId: conn.patientId,
      rawIds: inserted.map((r) => r.id),
    });

    // Update sync_jobs + connection status
    await db.update(syncJobs).set({
      status: "success",
      completedAt: new Date(),
      recordsIngested: inserted.length,
      newConflictsCount: resolveSummary.newConflicts,
    }).where(eq(syncJobs.id, job.id));

    await db.update(connections).set({
      status: "connected",
      lastSyncAt: new Date(),
      lastSyncStatus: "success",
      lastSyncError: null,
    }).where(eq(connections.id, connectionId));

    log.info("sync.success", {
      connectionId, source: conn.sourceId,
      ingested: inserted.length, conflicts: resolveSummary.newConflicts,
    });
    return { ok: true, ingested: inserted.length, conflicts: resolveSummary.newConflicts };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("sync.failed", err, { connectionId });
    await db.update(syncJobs).set({
      status: "failure", completedAt: new Date(), error: message,
    }).where(eq(syncJobs.id, job.id));
    await db.update(connections).set({
      status: "error", lastSyncStatus: "failure", lastSyncError: message,
    }).where(eq(connections.id, connectionId));
    return { ok: false, ingested: 0, conflicts: 0, error: message };
  }
}

/** Run sync for all due connections of all users — invoked by Vercel Cron. */
export async function runDueSyncs(): Promise<{ totalRan: number; ok: number; failed: number }> {
  const due = await db.execute<{ id: string; sync_interval: string; last_sync_at: string | null }>(sql`
    select id, sync_interval, last_sync_at::text as last_sync_at
      from connections
     where status in ('connected', 'error')
       and (
         last_sync_at is null
         or (sync_interval = 'daily'  and last_sync_at < now() - interval '23 hours')
         or (sync_interval = 'weekly' and last_sync_at < now() - interval '6 days 23 hours')
       )
     limit 200
  `);

  let ok = 0, failed = 0;
  for (const row of due) {
    const r = await runSyncForConnection(row.id);
    if (r.ok) ok++; else failed++;
  }
  return { totalRan: due.length, ok, failed };
}
