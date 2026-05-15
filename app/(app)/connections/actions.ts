"use server";
import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { connections, patientProfiles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRegistry } from "@/lib/connectors/registry";
import { getCatalogEntry } from "@/lib/connectors/catalog";
import { runSyncForConnection } from "@/lib/sync/runner";
import { log } from "@/lib/logger";
import { randomUUID } from "crypto";

async function getProfile(userId: string) {
  const [p] = await db
    .select({ id: patientProfiles.id })
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, userId))
    .limit(1);
  return p;
}

/** Kick off a connection. For real connectors, redirects to OAuth.
 *  For mock connectors, instantly marks "connected" + seeds sample data.
 *
 *  `variantLabel` is the human-readable name. For free-text variants
 *  (e.g. user-typed Epic health systems), we use it directly to build the
 *  connection's displayName instead of looking it up in the catalog. */
export async function connectSource(
  catalogId: string,
  variantId?: string,
  variantLabel?: string,
) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile) return;

  const entry = getCatalogEntry(catalogId);
  if (!entry) throw new Error(`Unknown source: ${catalogId}`);

  const sourceId = variantId ? `${catalogId}:${variantId}` : catalogId;
  const registry = getRegistry();
  const connector = registry[catalogId] ?? null;

  const resolvedLabel =
    variantLabel?.trim() ||
    entry.variants?.find((v) => v.id === variantId)?.label ||
    undefined;
  const displayName = entry.name + (resolvedLabel ? ` (${resolvedLabel})` : "");

  // Real OAuth: kick off authorization redirect.
  // (Mock connectors use the same flow but their getAuthUrl returns our own callback.)
  if (connector?.isReal) {
    const state = randomUUID();
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/connections/${catalogId}/callback`;

    // Reserve a pending row keyed by state via the connections table.
    await db
      .insert(connections)
      .values({
        userId: user.id,
        patientId: profile.id,
        sourceId,
        displayName,
        status: "pending",
        permissions: [],
        syncInterval: "daily",
        externalAccountId: state, // use this column as temp state holder
      })
      .onConflictDoUpdate({
        target: [connections.userId, connections.sourceId],
        set: { status: "pending", externalAccountId: state, disconnectedAt: null },
      });

    const url = connector.getAuthUrl({ state, redirectUri });
    redirect(url);
  }

  // Mock path: instantly seed.
  log.info("connector.mock.connect", { sourceId });
  const [row] = await db
    .insert(connections)
    .values({
      userId: user.id,
      patientId: profile.id,
      sourceId,
      displayName,
      status: "connected",
      permissions: ["mock:read"],
      syncInterval: "daily",
      connectedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [connections.userId, connections.sourceId],
      set: { status: "connected", disconnectedAt: null, permissions: ["mock:read"] },
    })
    .returning({ id: connections.id });

  await runSyncForConnection(row.id);
  revalidatePath("/connections");
  revalidatePath("/dashboard");
}

export async function disconnectSource(connectionId: string) {
  const user = await requireUser();
  await db
    .update(connections)
    .set({ status: "disconnected", disconnectedAt: new Date() })
    .where(and(eq(connections.id, connectionId), eq(connections.userId, user.id)));
  revalidatePath("/connections");
}

export async function resyncSource(connectionId: string) {
  const user = await requireUser();
  const [c] = await db
    .select({ id: connections.id })
    .from(connections)
    .where(and(eq(connections.id, connectionId), eq(connections.userId, user.id)))
    .limit(1);
  if (!c) return;
  await runSyncForConnection(c.id);
  revalidatePath("/connections");
  revalidatePath("/dashboard");
}
