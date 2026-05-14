import { sql } from "drizzle-orm";
import {
  pgTable, uuid, text, timestamp, date, integer, numeric,
  jsonb, customType, pgEnum, uniqueIndex, index,
} from "drizzle-orm/pg-core";

// bytea custom type for encrypted PHI fields
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() { return "bytea"; },
});

// --- enums ----------------------------------------------------------------
export const sexAtBirth = pgEnum("sex_at_birth", ["male", "female", "intersex", "prefer_not_to_say"]);
export const insurancePriority = pgEnum("insurance_priority", ["primary", "secondary"]);
export const providerKind = pgEnum("provider_kind", ["pcp", "specialist", "pharmacy"]);
export const connectionStatus = pgEnum("connection_status", [
  "connected", "disconnected", "error", "syncing", "pending",
]);
export const syncStatus = pgEnum("sync_status", ["pending", "running", "success", "failure", "partial"]);
export const conflictStatus = pgEnum("conflict_status", ["pending", "resolved", "dismissed"]);
export const recordType = pgEnum("record_type", [
  "vital", "lab", "medication", "allergy", "condition",
  "visit", "imaging", "wearable_metric", "sleep", "activity", "nutrition", "mental_health",
]);

// --- patient_profiles -----------------------------------------------------
export const patientProfiles = pgTable("patient_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  legalFirstName: text("legal_first_name"),
  middleInitial: text("middle_initial"),
  lastName: text("last_name"),
  preferredName: text("preferred_name"),
  dob: date("dob"),
  sexAtBirth: sexAtBirth("sex_at_birth"),
  genderIdentity: text("gender_identity"),
  phone: text("phone"),
  email: text("email"),
  addressStreet: text("address_street"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressZip: text("address_zip"),
  ssnLast4Encrypted: bytea("ssn_last4_encrypted"),
  emergencyContact: jsonb("emergency_contact"),
  intakeProgress: jsonb("intake_progress").default(sql`'{}'::jsonb`),
  intakeStep: integer("intake_step").default(1),
  intakeCompletedAt: timestamp("intake_completed_at", { withTimezone: true }),
  consents: jsonb("consents"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- insurance_policies ---------------------------------------------------
export const insurancePolicies = pgTable("insurance_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull(),
  priority: insurancePriority("priority").notNull().default("primary"),
  carrier: text("carrier"),
  memberIdEncrypted: bytea("member_id_encrypted"),
  groupNumberEncrypted: bytea("group_number_encrypted"),
  policyHolderName: text("policy_holder_name"),
  policyHolderRelationship: text("policy_holder_relationship"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- providers ------------------------------------------------------------
export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull(),
  kind: providerKind("kind").notNull(),
  name: text("name"),
  specialty: text("specialty"),
  practice: text("practice"),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- connections ----------------------------------------------------------
export const connections = pgTable(
  "connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    patientId: uuid("patient_id").notNull(),
    sourceId: text("source_id").notNull(),
    displayName: text("display_name"),
    status: connectionStatus("status").notNull().default("pending"),
    accessTokenEncrypted: bytea("access_token_encrypted"),
    refreshTokenEncrypted: bytea("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    permissions: jsonb("permissions").default(sql`'[]'::jsonb`),
    syncInterval: text("sync_interval").notNull().default("daily"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    lastSyncStatus: syncStatus("last_sync_status"),
    lastSyncError: text("last_sync_error"),
    externalAccountId: text("external_account_id"),
    connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow(),
    disconnectedAt: timestamp("disconnected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userSourceUnique: uniqueIndex("connections_user_source_uq").on(t.userId, t.sourceId) }),
);

// --- raw_records ----------------------------------------------------------
export const rawRecords = pgTable("raw_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  connectionId: uuid("connection_id").notNull(),
  sourceId: text("source_id").notNull(),
  recordType: recordType("record_type").notNull(),
  externalId: text("external_id"),
  payload: jsonb("payload").notNull(),
  effectiveDate: timestamp("effective_date", { withTimezone: true }),
  sourceAttribution: jsonb("source_attribution"),
  ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- unified_records ------------------------------------------------------
export const unifiedRecords = pgTable("unified_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull(),
  recordType: recordType("record_type").notNull(),
  normalizedPayload: jsonb("normalized_payload").notNull(),
  effectiveDate: timestamp("effective_date", { withTimezone: true }),
  confidenceScore: numeric("confidence_score", { precision: 4, scale: 3 }),
  sourceRecordIds: uuid("source_record_ids").array().notNull().default(sql`'{}'::uuid[]`),
  survivorshipPolicy: text("survivorship_policy"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- conflicts ------------------------------------------------------------
export const conflicts = pgTable("conflicts", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull(),
  recordType: recordType("record_type").notNull(),
  fieldInConflict: text("field_in_conflict").notNull(),
  conflictingRecordIds: uuid("conflicting_record_ids").array().notNull().default(sql`'{}'::uuid[]`),
  details: jsonb("details"),
  status: conflictStatus("status").notNull().default("pending"),
  resolution: jsonb("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// --- sync_jobs ------------------------------------------------------------
export const syncJobs = pgTable("sync_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectionId: uuid("connection_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: syncStatus("status").notNull().default("pending"),
  recordsIngested: integer("records_ingested").default(0),
  newConflictsCount: integer("new_conflicts_count").default(0),
  error: text("error"),
});

// type exports
export type PatientProfile = typeof patientProfiles.$inferSelect;
export type NewPatientProfile = typeof patientProfiles.$inferInsert;
export type Connection = typeof connections.$inferSelect;
export type RawRecord = typeof rawRecords.$inferSelect;
export type UnifiedRecord = typeof unifiedRecords.$inferSelect;
export type Conflict = typeof conflicts.$inferSelect;
