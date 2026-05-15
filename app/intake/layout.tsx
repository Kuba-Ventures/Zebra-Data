import { redirect } from "next/navigation";
import { getUser, isDemoSession } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { patientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ZebraMark } from "@/components/ZebraLogo";
import { UserMenu } from "@/components/UserMenu";

export default async function IntakeLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  // Demo sessions go straight to the dashboard - intake writes need a real Supabase user.
  if (await isDemoSession()) {
    redirect("/dashboard");
  }

  // Already completed → dashboard
  const [profile] = await db
    .select({ intakeCompletedAt: patientProfiles.intakeCompletedAt })
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, user.id))
    .limit(1);

  if (profile?.intakeCompletedAt) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-surface/80 backdrop-blur-xl">
        <div className="max-w-[1100px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <ZebraMark className="w-7 h-7" />
            <span className="font-display font-semibold tracking-[-0.02em]">
              Zebra<span className="text-mid font-medium">Data</span>
            </span>
          </Link>
          <UserMenu email={user.email ?? ""} />
        </div>
      </header>
      {children}
    </div>
  );
}
