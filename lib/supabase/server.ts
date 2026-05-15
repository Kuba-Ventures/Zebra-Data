import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { DEMO_COOKIE, parseDemoCookieValue } from "@/lib/demo";

export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server components cannot set cookies — middleware handles refresh.
          }
        },
      },
    },
  );
}

export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const demo = parseDemoCookieValue(cookieStore.get(DEMO_COOKIE)?.value);
  if (demo) {
    return {
      id: demo.id,
      email: demo.email,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User;
  }
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function isDemoSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return parseDemoCookieValue(cookieStore.get(DEMO_COOKIE)?.value) !== null;
}
