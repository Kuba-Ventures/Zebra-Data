import "server-only";
import { db } from "@/lib/db";
import { patientProfiles, insurancePolicies } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { withPhiKey } from "@/lib/crypto";
import { jaroWinkler } from "./probabilistic";

/**
 * Patient-level identity resolution.
 *
 * Currently the auth user is the unambiguous "owner" of their patient profile
 * (they create the account, they connect the source). This module exists to
 * handle the harder cases:
 *   - Incoming data from a webhook before the user has an account
 *   - "Claim your record" flows
 *   - Future B2B EHR ingestion paths
 *
 * Pipeline:
 *   1. Deterministic match:
 *        a. (last_name + dob + ssn_last4)  → high-confidence auto-link
 *        b. (last_name + dob + insurance_member_id) → auto-link
 *   2. Probabilistic match (Jaro-Winkler on names, exact DOB, etc.)
 *        - score >= 0.85 → auto-link
 *        - 0.60–0.85    → flag for user review (returns "needs_review")
 *        - < 0.60       → unmatched (caller decides what to do)
 */
export type ResolutionResult =
  | { kind: "auto_link"; patientId: string; method: "deterministic"; ruleId: "name_dob_ssn4" | "name_dob_member_id" }
  | { kind: "auto_link"; patientId: string; method: "probabilistic"; score: number }
  | { kind: "needs_review"; candidates: { patientId: string; score: number }[] }
  | { kind: "unmatched" };

export type IncomingIdentity = {
  firstName?: string | null;
  lastName?: string | null;
  dob?: string | null;             // ISO date 'YYYY-MM-DD'
  ssnLast4?: string | null;
  insuranceMemberId?: string | null;
  phone?: string | null;
  email?: string | null;
  addressZip?: string | null;
};

const AUTO_LINK_THRESHOLD = 0.85;
const REVIEW_THRESHOLD = 0.60;

export async function resolveIncomingPatient(incoming: IncomingIdentity): Promise<ResolutionResult> {
  // ----- Deterministic -----
  if (incoming.lastName && incoming.dob && incoming.ssnLast4) {
    const hit = await withPhiKey(async () => {
      const rows = await db.execute<{ id: string }>(sql`
        select id from patient_profiles
         where lower(last_name) = lower(${incoming.lastName})
           and dob = ${incoming.dob}::date
           and zebra_phi_decrypt(ssn_last4_encrypted) = ${incoming.ssnLast4}
         limit 1
      `);
      return rows[0]?.id ?? null;
    });
    if (hit) return { kind: "auto_link", patientId: hit, method: "deterministic", ruleId: "name_dob_ssn4" };
  }

  if (incoming.lastName && incoming.dob && incoming.insuranceMemberId) {
    const hit = await withPhiKey(async () => {
      const rows = await db.execute<{ id: string }>(sql`
        select p.id from patient_profiles p
          join insurance_policies i on i.patient_id = p.id
         where lower(p.last_name) = lower(${incoming.lastName})
           and p.dob = ${incoming.dob}::date
           and zebra_phi_decrypt(i.member_id_encrypted) = ${incoming.insuranceMemberId}
         limit 1
      `);
      return rows[0]?.id ?? null;
    });
    if (hit) return { kind: "auto_link", patientId: hit, method: "deterministic", ruleId: "name_dob_member_id" };
  }

  // ----- Probabilistic -----
  // Narrow to a candidate set first (same DOB or matching ZIP) to bound search.
  const candidates = await db.execute<{
    id: string; last_name: string; legal_first_name: string; dob: string;
    address_zip: string; phone: string; email: string;
  }>(sql`
    select id, last_name, legal_first_name, dob::text, address_zip, phone, email
      from patient_profiles
     where dob = ${incoming.dob ?? null}::date
        or address_zip = ${incoming.addressZip ?? null}
  `);

  const scored: { patientId: string; score: number }[] = [];
  for (const c of candidates) {
    const nameScore = scoreName(incoming, c);
    const dobScore = incoming.dob && incoming.dob === c.dob ? 1 : 0;
    const phoneScore = incoming.phone && c.phone && incoming.phone.replace(/\D/g, "") === c.phone.replace(/\D/g, "") ? 1 : 0;
    const emailScore = incoming.email && c.email && incoming.email.toLowerCase() === c.email.toLowerCase() ? 1 : 0;
    const zipScore = incoming.addressZip && incoming.addressZip === c.address_zip ? 1 : 0;
    // Weighted blend
    const score = 0.45 * nameScore + 0.25 * dobScore + 0.10 * phoneScore + 0.10 * emailScore + 0.10 * zipScore;
    scored.push({ patientId: c.id, score });
  }
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top) return { kind: "unmatched" };
  if (top.score >= AUTO_LINK_THRESHOLD) {
    return { kind: "auto_link", patientId: top.patientId, method: "probabilistic", score: top.score };
  }
  if (top.score >= REVIEW_THRESHOLD) {
    return { kind: "needs_review", candidates: scored.slice(0, 3) };
  }
  return { kind: "unmatched" };
}

function scoreName(
  incoming: IncomingIdentity,
  candidate: { last_name: string; legal_first_name: string },
): number {
  const inFirst = (incoming.firstName ?? "").toLowerCase();
  const inLast = (incoming.lastName ?? "").toLowerCase();
  const cFirst = (candidate.legal_first_name ?? "").toLowerCase();
  const cLast = (candidate.last_name ?? "").toLowerCase();
  return 0.6 * jaroWinkler(inLast, cLast) + 0.4 * jaroWinkler(inFirst, cFirst);
}
