import { NextResponse, type NextRequest } from "next/server";
import { runDueSyncs } from "@/lib/sync/runner";
import { log } from "@/lib/logger";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
  // Vercel also sets x-vercel-cron when triggered by the platform.
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") !== null;
  const secret = process.env.CRON_SECRET;

  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  log.info("cron.sync.start");
  const summary = await runDueSyncs();
  log.info("cron.sync.done", summary);
  return NextResponse.json({ success: true, ...summary });
}
