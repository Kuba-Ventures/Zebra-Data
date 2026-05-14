import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164-ish, lenient
const usZip = /^\d{5}(-\d{4})?$/;

export const step1Schema = z.object({
  legalFirstName: z.string().min(1, "First name is required").max(80),
  middleInitial: z.string().max(2).optional().or(z.literal("")),
  lastName: z.string().min(1, "Last name is required").max(80),
  preferredName: z.string().max(80).optional().or(z.literal("")),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((s) => {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return false;
      const yr = d.getFullYear();
      return yr >= 1900 && yr <= new Date().getFullYear();
    }, "Enter a valid date of birth"),
  sexAtBirth: z.enum(["male", "female", "intersex", "prefer_not_to_say"]),
  genderIdentity: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
});

export const step2Schema = z.object({
  addressStreet: z.string().min(2, "Street is required").max(160),
  addressCity: z.string().min(1, "City is required").max(80),
  addressState: z.string().length(2, "2-letter state code"),
  addressZip: z.string().regex(usZip, "Enter a valid ZIP code"),
  ssnLast4: z
    .string()
    .regex(/^\d{4}$/, "Must be exactly 4 digits")
    .optional()
    .or(z.literal("")),
  emergencyContactName: z.string().min(1, "Name is required").max(120),
  emergencyContactRelationship: z.string().min(1, "Relationship is required").max(60),
  emergencyContactPhone: z.string().regex(phoneRegex, "Enter a valid phone number"),
});

const insurancePolicy = z.object({
  carrier: z.string().min(1, "Carrier is required").max(80),
  memberId: z.string().min(1, "Member ID is required").max(80),
  groupNumber: z.string().max(80).optional().or(z.literal("")),
  policyHolderName: z.string().min(1, "Policy holder name is required").max(160),
  policyHolderRelationship: z.string().min(1).max(60),
});

export const step3Schema = z.object({
  primary: insurancePolicy,
  secondary: insurancePolicy.partial().optional(),
});

const providerEntry = z.object({
  name: z.string().max(120).optional().or(z.literal("")),
  practice: z.string().max(160).optional().or(z.literal("")),
  location: z.string().max(160).optional().or(z.literal("")),
  specialty: z.string().max(80).optional().or(z.literal("")),
});

export const step4Schema = z.object({
  pcp: providerEntry,
  specialists: z.array(providerEntry).max(8).default([]),
  pharmacy: z.object({
    name: z.string().max(120).optional().or(z.literal("")),
    location: z.string().max(160).optional().or(z.literal("")),
  }),
});

export const step5Schema = z.object({
  hipaaConsent: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  termsConsent: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  privacyConsent: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
});

export type Step1 = z.infer<typeof step1Schema>;
export type Step2 = z.infer<typeof step2Schema>;
export type Step3 = z.infer<typeof step3Schema>;
export type Step4 = z.infer<typeof step4Schema>;
export type Step5 = z.infer<typeof step5Schema>;

export const INTAKE_STEPS = [
  { id: 1, key: "identity",  title: "Personal identity",   blurb: "How your records are matched across systems." },
  { id: 2, key: "address",   title: "Address & identifiers", blurb: "Used to resolve you across health systems." },
  { id: 3, key: "insurance", title: "Insurance",           blurb: "We use this to fetch claims & coverage data." },
  { id: 4, key: "providers", title: "Primary providers",   blurb: "Optional — speeds up your first sync." },
  { id: 5, key: "review",    title: "Review & consent",    blurb: "Confirm what we'll store and how we'll use it." },
] as const;
