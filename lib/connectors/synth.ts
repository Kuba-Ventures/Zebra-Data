import type { ConnectorRecord } from "./types";

/**
 * Synthetic data generators. Output realistic-looking shapes for every record
 * type so the dashboard fills up after any mock connection.
 *
 * No real PHI here — names, values, and dates are fabricated.
 */

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function rand(min: number, max: number, decimals = 0): number {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ============ Vitals ============
export function synthVitals(sourceId: string, days: number): ConnectorRecord[] {
  const out: ConnectorRecord[] = [];
  for (let i = 0; i < Math.max(1, Math.floor(days / 3)); i++) {
    const d = daysAgo(i * 3);
    out.push({
      recordType: "vital",
      externalId: `${sourceId}-bp-${d.toISOString()}`,
      effectiveDate: d,
      payload: { kind: "blood_pressure", value: `${rand(110, 130)}/${rand(68, 82)}`, source: sourceId },
      sourceAttribution: { source: sourceId },
    });
    out.push({
      recordType: "vital",
      externalId: `${sourceId}-hr-${d.toISOString()}`,
      effectiveDate: d,
      payload: { kind: "heart_rate", value: rand(58, 72), unit: "bpm", source: sourceId },
      sourceAttribution: { source: sourceId },
    });
    if (i === 0) {
      out.push({
        recordType: "vital",
        externalId: `${sourceId}-wt-${d.toISOString()}`,
        effectiveDate: d,
        payload: { kind: "weight", value: rand(140, 200), unit: "lb", source: sourceId },
        sourceAttribution: { source: sourceId },
      });
    }
  }
  return out;
}

// ============ Labs ============
export function synthLabs(sourceId: string, days: number): ConnectorRecord[] {
  const panel: { name: string; unit: string; min: number; max: number; ref: [number, number] }[] = [
    { name: "Total cholesterol", unit: "mg/dL", min: 150, max: 230, ref: [100, 200] },
    { name: "LDL", unit: "mg/dL", min: 80, max: 160, ref: [0, 100] },
    { name: "HDL", unit: "mg/dL", min: 40, max: 80, ref: [40, 60] },
    { name: "Triglycerides", unit: "mg/dL", min: 80, max: 200, ref: [0, 150] },
    { name: "Hemoglobin A1c", unit: "%", min: 4.8, max: 6.4, ref: [4.0, 5.7] },
    { name: "Vitamin D, 25-OH", unit: "ng/mL", min: 18, max: 65, ref: [30, 100] },
    { name: "TSH", unit: "mIU/L", min: 0.6, max: 4.5, ref: [0.4, 4.0] },
    { name: "Creatinine", unit: "mg/dL", min: 0.7, max: 1.3, ref: [0.7, 1.3] },
  ];

  const drawDate = daysAgo(Math.max(7, days - 5));
  return panel.map((p) => {
    const decimals = p.name === "Hemoglobin A1c" || p.name === "Creatinine" ? 1 : 0;
    const v = Number(rand(p.min, p.max, decimals === 1 ? 1 : decimals));
    const flag = v < p.ref[0] ? "low" : v > p.ref[1] ? "high" : "normal";
    return {
      recordType: "lab" as const,
      externalId: `${sourceId}-lab-${p.name}-${drawDate.toISOString()}`,
      effectiveDate: drawDate,
      payload: { name: p.name, value: v, unit: p.unit, referenceRange: `${p.ref[0]}–${p.ref[1]}`, flag, source: sourceId },
      sourceAttribution: { source: sourceId },
    };
  });
}

// ============ Medications ============
export function synthMedications(sourceId: string): ConnectorRecord[] {
  const meds = [
    { name: "Atorvastatin", dosage: "20 mg", frequency: "Once daily" },
    { name: "Lisinopril", dosage: "10 mg", frequency: "Once daily" },
    { name: "Metformin", dosage: "500 mg", frequency: "Twice daily" },
  ];
  return meds.slice(0, 2).map((m) => ({
    recordType: "medication" as const,
    externalId: `${sourceId}-rx-${m.name}`,
    effectiveDate: daysAgo(60),
    payload: {
      ...m,
      active: true,
      refillDate: daysAgo(-14), // 14 days from now
      prescriber: pick(["Dr. Patel", "Dr. Chen", "Dr. Okafor"]),
      source: sourceId,
    },
    sourceAttribution: { source: sourceId },
  }));
}

// ============ Allergies ============
export function synthAllergies(sourceId: string): ConnectorRecord[] {
  // Pick 1–2 from a small set — and intentionally vary which appear per source.
  const all = [
    { name: "Penicillin", severity: "moderate" },
    { name: "Peanuts", severity: "severe" },
    { name: "Sulfa drugs", severity: "mild" },
  ];
  const seed = sourceId.charCodeAt(0) % 3;
  const pickList = seed === 0 ? [all[0]] : seed === 1 ? [all[0], all[2]] : [all[1]];
  return pickList.map((a) => ({
    recordType: "allergy" as const,
    externalId: `${sourceId}-allergy-${a.name}`,
    effectiveDate: daysAgo(365),
    payload: { ...a, reaction: pick(["Rash", "Anaphylaxis", "Hives"]), source: sourceId },
    sourceAttribution: { source: sourceId },
  }));
}

// ============ Conditions ============
export function synthConditions(sourceId: string): ConnectorRecord[] {
  const conditions = ["Hypertension, controlled", "Hyperlipidemia", "Vitamin D deficiency"];
  return conditions.slice(0, 2).map((name) => ({
    recordType: "condition" as const,
    externalId: `${sourceId}-cond-${name}`,
    effectiveDate: daysAgo(rand(60, 700)),
    payload: { name, status: "active", source: sourceId },
    sourceAttribution: { source: sourceId },
  }));
}

// ============ Visits ============
export function synthVisits(sourceId: string, _days: number): ConnectorRecord[] {
  return [
    {
      recordType: "visit",
      externalId: `${sourceId}-visit-1`,
      effectiveDate: daysAgo(rand(7, 30)),
      payload: {
        provider: "Dr. Maya Patel, MD",
        reason: "Annual physical",
        summary: "Routine wellness exam. All vitals within normal range. Recommend repeat lipid panel in 6 months.",
        source: sourceId,
      },
      sourceAttribution: { source: sourceId },
    },
    {
      recordType: "visit",
      externalId: `${sourceId}-visit-2`,
      effectiveDate: daysAgo(rand(60, 120)),
      payload: {
        provider: "Dr. Lee Chen, MD",
        reason: "Follow-up — hypertension",
        summary: "BP improved on current regimen. Continue lisinopril 10mg.",
        source: sourceId,
      },
      sourceAttribution: { source: sourceId },
    },
  ];
}

// ============ Imaging ============
export function synthImaging(sourceId: string, _days: number): ConnectorRecord[] {
  return [
    {
      recordType: "imaging",
      externalId: `${sourceId}-img-1`,
      effectiveDate: daysAgo(rand(30, 120)),
      payload: { modality: "X-ray", bodyPart: "Chest", facility: "VCU Medical Center", findings: "No acute findings.", source: sourceId },
      sourceAttribution: { source: sourceId },
    },
  ];
}

// ============ Wearable metrics ============
export function synthWearableMetrics(
  sourceId: string,
  opts: { withHrv?: boolean; withRecovery?: boolean; withReadiness?: boolean; sinceDays?: number } = {},
): ConnectorRecord[] {
  const days = opts.sinceDays ?? 7;
  const out: ConnectorRecord[] = [];
  for (let i = 0; i < days; i++) {
    const d = daysAgo(i);
    if (opts.withHrv) {
      out.push({
        recordType: "wearable_metric",
        externalId: `${sourceId}-hrv-${i}`,
        effectiveDate: d,
        payload: { kind: "hrv", value: rand(45, 78), unit: "ms", source: sourceId },
        sourceAttribution: { source: sourceId },
      });
    }
    if (opts.withRecovery) {
      out.push({
        recordType: "wearable_metric",
        externalId: `${sourceId}-rec-${i}`,
        effectiveDate: d,
        payload: { kind: "recovery", value: rand(40, 90), source: sourceId },
        sourceAttribution: { source: sourceId },
      });
    }
    if (opts.withReadiness) {
      out.push({
        recordType: "wearable_metric",
        externalId: `${sourceId}-ready-${i}`,
        effectiveDate: d,
        payload: { kind: "readiness", value: rand(60, 95), source: sourceId },
        sourceAttribution: { source: sourceId },
      });
    }
  }
  return out;
}

// ============ Sleep ============
export function synthSleep(sourceId: string, days: number): ConnectorRecord[] {
  const out: ConnectorRecord[] = [];
  for (let i = 0; i < days; i++) {
    out.push({
      recordType: "sleep",
      externalId: `${sourceId}-sleep-${i}`,
      effectiveDate: daysAgo(i),
      payload: {
        hours: rand(5.5, 8.5, 1),
        efficiency: rand(78, 96),
        quality: pick(["Good", "Fair", "Excellent"]),
        deepMinutes: rand(60, 110),
        remMinutes: rand(80, 130),
        source: sourceId,
      },
      sourceAttribution: { source: sourceId },
    });
  }
  return out;
}

// ============ Activity ============
export function synthActivity(sourceId: string, days: number, types: string[]): ConnectorRecord[] {
  const out: ConnectorRecord[] = [];
  for (let i = 0; i < days; i++) {
    out.push({
      recordType: "activity",
      externalId: `${sourceId}-steps-${i}`,
      effectiveDate: daysAgo(i),
      payload: { kind: "steps", value: rand(4500, 13500), source: sourceId },
      sourceAttribution: { source: sourceId },
    });
    if (i % 2 === 0) {
      out.push({
        recordType: "activity",
        externalId: `${sourceId}-workout-${i}`,
        effectiveDate: daysAgo(i),
        payload: {
          type: pick(types),
          duration: rand(20, 75),
          calories: rand(180, 720),
          avgHr: rand(120, 170),
          source: sourceId,
        },
        sourceAttribution: { source: sourceId },
      });
    }
  }
  return out;
}

// ============ Nutrition ============
export function synthNutrition(sourceId: string, days: number): ConnectorRecord[] {
  const out: ConnectorRecord[] = [];
  for (let i = 0; i < days; i++) {
    out.push({
      recordType: "nutrition",
      externalId: `${sourceId}-nutr-${i}`,
      effectiveDate: daysAgo(i),
      payload: {
        calories: rand(1800, 2600),
        protein: rand(80, 160),
        carbs: rand(150, 320),
        fat: rand(50, 110),
        source: sourceId,
      },
      sourceAttribution: { source: sourceId },
    });
  }
  return out;
}

// ============ Mental health ============
export function synthMentalHealth(sourceId: string, days: number): ConnectorRecord[] {
  const out: ConnectorRecord[] = [];
  for (let i = 0; i < days; i++) {
    if (i % 2 === 0) {
      out.push({
        recordType: "mental_health",
        externalId: `${sourceId}-mh-${i}`,
        effectiveDate: daysAgo(i),
        payload: {
          type: pick(["Meditation", "Breathwork", "Sleep story"]),
          duration: rand(5, 25),
          mood: pick(["Calm", "Focused", "Relaxed"]),
          source: sourceId,
        },
        sourceAttribution: { source: sourceId },
      });
    }
  }
  return out;
}
