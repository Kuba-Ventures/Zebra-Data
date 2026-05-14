"use server";
import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { conflicts, patientProfiles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function resolveConflict(
  conflictId: string,
  status: "resolved" | "dismissed",
  resolution?: Record<string, unknown>,
) {
  const user = await requireUser();
  const [profile] = await db
    .select({ id: patientProfiles.id })
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, user.id))
    .limit(1);
  if (!profile) return { ok: false as const };

  await db
    .update(conflicts)
    .set({
      status,
      resolution: resolution ?? null,
      resolvedAt: new Date(),
    })
    .where(and(eq(conflicts.id, conflictId), eq(conflicts.patientId, profile.id)));

  revalidatePath("/dashboard");
  return { ok: true as const };
}
