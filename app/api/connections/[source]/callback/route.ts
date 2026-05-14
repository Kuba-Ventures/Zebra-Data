import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { connections, patientProfiles } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { resolveConnectorBySourceId } from "@/lib/connectors/registry";
import { withPhiKey } from "@/lib/crypto";
import { runSyncForConnection } from "@/lib/sync/runner";
import { log } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ source: string }> },
) {
  const { source } = await context.params;
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/connections?error=missing_params", request.url));
  }

  const user = await requireUser();
  const [profile] = await db
    .select({ id: patientProfiles.id })
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, user.id))
    .limit(1);
  if (!profile) {
    return NextResponse.redirect(new URL("/intake", request.url));
  }

  // Find the pending row by state (stashed in externalAccountId).
  const [pending] = await db
    .select()
    .from(connections)
    .where(and(
      eq(connections.userId, user.id),
      eq(connections.externalAccountId, state),
    ))
    .limit(1);
  if (!pending) {
    return NextResponse.redirect(new URL("/connections?error=invalid_state", request.url));
  }

  const connector = resolveConnectorBySourceId(pending.sourceId);
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/api/connections/${source}/callback`;

  try {
    const tokens = await connector.exchangeCode({ code, redirectUri });
    await withPhiKey(async () => {
      await db.execute(sql`
        update connections set
          status = 'connected',
          access_token_encrypted = zebra_phi_encrypt(${tokens.accessToken}),
          refresh_token_encrypted = ${tokens.refreshToken ? sql`zebra_phi_encrypt(${tokens.refreshToken})` : sql`null`},
          token_expires_at = ${tokens.expiresAt?.toISOString() ?? null},
          permissions = ${JSON.stringify(connector.permissions)}::jsonb,
          external_account_id = ${tokens.externalAccountId ?? null},
          connected_at = now()
        where id = ${pending.id}::uuid
      `);
    });

    // Kick off the first sync inline so the dashboard fills up immediately.
    await runSyncForConnection(pending.id);
    log.info("oauth.callback.success", { source, connectionId: pending.id });
    return NextResponse.redirect(new URL("/dashboard?just_connected=" + source, request.url));
  } catch (err) {
    log.error("oauth.callback.failed", err, { source });
    await db.update(connections).set({
      status: "error",
      lastSyncError: err instanceof Error ? err.message : String(err),
    }).where(eq(connections.id, pending.id));
    return NextResponse.redirect(new URL("/connections?error=token_exchange_failed", request.url));
  }
}
