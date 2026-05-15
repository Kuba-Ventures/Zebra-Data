import { getUser, isDemoSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { patientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AccountForm } from "./AccountForm";

export const metadata = { title: "Account · Zebra Data" };

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const demo = await isDemoSession();
  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, user.id))
    .limit(1);

  return (
    <div className="max-w-[820px] mx-auto px-6 py-8 sm:py-10">
      <div>
        <div className="eyebrow">Account</div>
        <h1 className="mt-2 font-display font-semibold text-[2rem] sm:text-[2.4rem] tracking-[-0.03em]">
          Your profile & settings
        </h1>
        <p className="text-mid mt-1.5 max-w-[60ch]">
          Update how Zebra addresses you, change your email or password, and tune your preferences.
        </p>
      </div>

      <AccountForm
        isDemo={demo}
        email={user.email ?? ""}
        initial={{
          preferredName: profile?.preferredName ?? "",
          legalFirstName: profile?.legalFirstName ?? "",
          lastName: profile?.lastName ?? "",
          phone: profile?.phone ?? "",
          addressStreet: profile?.addressStreet ?? "",
          addressCity: profile?.addressCity ?? "",
          addressState: profile?.addressState ?? "",
          addressZip: profile?.addressZip ?? "",
        }}
      />
    </div>
  );
}
