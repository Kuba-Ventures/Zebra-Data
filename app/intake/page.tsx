import { getUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { patientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { IntakeWizard } from "./IntakeWizard";

export const metadata = { title: "Intake · Zebra Data" };

export default async function IntakePage() {
  const user = (await getUser())!;

  // Load any in-flight progress
  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, user.id))
    .limit(1);

  const initialProgress = (profile?.intakeProgress as Record<string, unknown>) ?? {};
  const initialStep = profile?.intakeStep ?? 1;
  const defaultEmail = user.email ?? "";

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-10">
      <IntakeWizard
        defaultEmail={defaultEmail}
        initialProgress={initialProgress}
        initialStep={initialStep}
      />
    </main>
  );
}
