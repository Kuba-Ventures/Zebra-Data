import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, isDemoSession } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { patientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ZebraMark } from "@/components/ZebraLogo";
import { LayoutDashboard, Plug } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  // Demo sessions skip the intake-completion gate so the product UI is visible.
  const demo = await isDemoSession();
  if (!demo) {
    const [profile] = await db
      .select({ intakeCompletedAt: patientProfiles.intakeCompletedAt })
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, user.id))
      .limit(1);

    if (!profile?.intakeCompletedAt) {
      redirect("/intake");
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-line">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-ink">
            <ZebraMark className="w-7 h-7" />
            <span className="font-display font-semibold tracking-[-0.02em] hidden sm:inline">
              Zebra<span className="text-mid font-medium">Data</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
            <NavLink href="/connections" icon={Plug}>Connections</NavLink>
          </nav>
          <UserMenu email={user.email ?? ""} />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function NavLink({
  href, icon: Icon, children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm text-mid hover:text-ink hover:bg-surface-2 transition-colors inline-flex items-center gap-2"
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
