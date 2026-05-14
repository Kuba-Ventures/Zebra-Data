"use server";
import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  patientProfiles, insurancePolicies, providers, connections,
  unifiedRecords, conflicts as conflictsTable,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { withPhiKey, encryptSql } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import {
  step1Schema, step2Schema, step3Schema, step4Schema, step5Schema,
} from "@/lib/validation/intake";
import { log } from "@/lib/logger";
import { z } from "zod";

type StepKey = "1" | "2" | "3" | "4" | "5";

async function ensureProfile(userId: string) {
  const [existing] = await db
    .select({ id: patientProfiles.id })
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, userId))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(patientProfiles)
    .values({ userId, intakeStep: 1, intakeProgress: {} })
    .returning({ id: patientProfiles.id });
  return created.id;
}

/** Save partial progress to intake_progress JSONB and advance intake_step. */
export async function saveIntakeStep(
  step: StepKey,
  raw: unknown,
): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  const user = await requireUser();
  await ensureProfile(user.id);

  const validators = {
    "1": step1Schema, "2": step2Schema, "3": step3Schema, "4": step4Schema, "5": step5Schema,
  } as const;

  const parsed = validators[step].safeParse(raw);
  if (!parsed.success) {
    const errs: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      errs[i.path.join(".") || "_"] = i.message;
    });
    return { ok: false, errors: errs };
  }

  const data = parsed.data;
  const stepNum = Number(step);

  await db
    .update(patientProfiles)
    .set({
      intakeProgress: sql`coalesce(intake_progress, '{}'::jsonb) || ${JSON.stringify({ [`step${step}`]: data })}::jsonb`,
      intakeStep: stepNum + 1 <= 5 ? stepNum + 1 : 5,
    })
    .where(eq(patientProfiles.userId, user.id));

  return { ok: true };
}

/** Finalize: write structured rows for all steps + mark complete + seed empty record. */
export async function submitIntake(
  progress: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const patientId = await ensureProfile(user.id);

  // Final validation pass on each step
  const validated: Record<string, unknown> = {};
  for (const [k, schema] of [
    ["step1", step1Schema], ["step2", step2Schema], ["step3", step3Schema],
    ["step4", step4Schema], ["step5", step5Schema],
  ] as const) {
    const parsed = schema.safeParse(progress[k]);
    if (!parsed.success) {
      log.warn("intake.submit.invalid", { step: k });
      return { ok: false, error: `Missing or invalid: ${k}` };
    }
    validated[k] = parsed.data;
  }

  const s1 = validated.step1 as z.infer<typeof step1Schema>;
  const s2 = validated.step2 as z.infer<typeof step2Schema>;
  const s3 = validated.step3 as z.infer<typeof step3Schema>;
  const s4 = validated.step4 as z.infer<typeof step4Schema>;
  const s5 = validated.step5 as z.infer<typeof step5Schema>;

  try {
    await withPhiKey(async () => {
      // Update profile core fields + encrypted ssn last 4
      await db.execute(sql`
        update patient_profiles set
          legal_first_name = ${s1.legalFirstName},
          middle_initial = ${s1.middleInitial || null},
          last_name = ${s1.lastName},
          preferred_name = ${s1.preferredName || null},
          dob = ${s1.dob}::date,
          sex_at_birth = ${s1.sexAtBirth}::sex_at_birth,
          gender_identity = ${s1.genderIdentity || null},
          phone = ${s1.phone},
          email = ${s1.email},
          address_street = ${s2.addressStreet},
          address_city = ${s2.addressCity},
          address_state = ${s2.addressState},
          address_zip = ${s2.addressZip},
          ssn_last4_encrypted = ${encryptSql(s2.ssnLast4 || null)},
          emergency_contact = ${JSON.stringify({
            name: s2.emergencyContactName,
            relationship: s2.emergencyContactRelationship,
            phone: s2.emergencyContactPhone,
          })}::jsonb,
          consents = ${JSON.stringify({
            hipaa: s5.hipaaConsent,
            terms: s5.termsConsent,
            privacy: s5.privacyConsent,
            timestamp: new Date().toISOString(),
          })}::jsonb,
          intake_completed_at = now(),
          intake_step = 5
        where user_id = ${user.id}::uuid
      `);

      // Insurance policies (replace any prior)
      await db.delete(insurancePolicies).where(eq(insurancePolicies.patientId, patientId));
      await db.execute(sql`
        insert into insurance_policies
          (patient_id, priority, carrier, member_id_encrypted, group_number_encrypted, policy_holder_name, policy_holder_relationship)
        values
          (${patientId}::uuid, 'primary',
           ${s3.primary.carrier},
           ${encryptSql(s3.primary.memberId)},
           ${encryptSql(s3.primary.groupNumber || null)},
           ${s3.primary.policyHolderName},
           ${s3.primary.policyHolderRelationship})
      `);
      if (s3.secondary?.carrier && s3.secondary?.memberId) {
        await db.execute(sql`
          insert into insurance_policies
            (patient_id, priority, carrier, member_id_encrypted, group_number_encrypted, policy_holder_name, policy_holder_relationship)
          values
            (${patientId}::uuid, 'secondary',
             ${s3.secondary.carrier},
             ${encryptSql(s3.secondary.memberId)},
             ${encryptSql(s3.secondary.groupNumber || null)},
             ${s3.secondary.policyHolderName ?? null},
             ${s3.secondary.policyHolderRelationship ?? null})
        `);
      }
    });

    // Providers (no encryption needed)
    await db.delete(providers).where(eq(providers.patientId, patientId));
    const providerRows: Array<typeof providers.$inferInsert> = [];
    if (s4.pcp.name) {
      providerRows.push({
        patientId, kind: "pcp",
        name: s4.pcp.name, practice: s4.pcp.practice || null,
        location: s4.pcp.location || null, specialty: "Primary care",
      });
    }
    for (const spec of s4.specialists) {
      if (spec.name) {
        providerRows.push({
          patientId, kind: "specialist",
          name: spec.name, practice: spec.practice || null,
          location: spec.location || null, specialty: spec.specialty || null,
        });
      }
    }
    if (s4.pharmacy.name) {
      providerRows.push({
        patientId, kind: "pharmacy",
        name: s4.pharmacy.name, location: s4.pharmacy.location || null,
      });
    }
    if (providerRows.length > 0) {
      await db.insert(providers).values(providerRows);
    }

    log.info("intake.completed", { userId: user.id });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    log.error("intake.submit.failed", err);
    return { ok: false, error: "Something went wrong saving your information. Please try again." };
  }
}
