"use server";
import { requireUser, isDemoSession } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { patientProfiles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  preferredName: z.string().trim().max(80).optional().nullable(),
  legalFirstName: z.string().trim().max(80).optional().nullable(),
  lastName: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  addressStreet: z.string().trim().max(200).optional().nullable(),
  addressCity: z.string().trim().max(100).optional().nullable(),
  addressState: z.string().trim().max(40).optional().nullable(),
  addressZip: z.string().trim().max(20).optional().nullable(),
});

export async function updateAccountProfile(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (await isDemoSession()) {
    return { ok: false, error: "Demo session — changes aren't saved. Sign up to keep your profile." };
  }

  const user = await requireUser();
  const data = parsed.data;
  const empty = (v: string | null | undefined) => (v && v.length > 0 ? v : null);

  await db
    .insert(patientProfiles)
    .values({
      userId: user.id,
      preferredName: empty(data.preferredName),
      legalFirstName: empty(data.legalFirstName),
      lastName: empty(data.lastName),
      phone: empty(data.phone),
      addressStreet: empty(data.addressStreet),
      addressCity: empty(data.addressCity),
      addressState: empty(data.addressState),
      addressZip: empty(data.addressZip),
    })
    .onConflictDoUpdate({
      target: patientProfiles.userId,
      set: {
        preferredName: empty(data.preferredName),
        legalFirstName: empty(data.legalFirstName),
        lastName: empty(data.lastName),
        phone: empty(data.phone),
        addressStreet: empty(data.addressStreet),
        addressCity: empty(data.addressCity),
        addressState: empty(data.addressState),
        addressZip: empty(data.addressZip),
        updatedAt: sql`now()`,
      },
    });

  revalidatePath("/account");
  return { ok: true };
}
