import { NextRequest, NextResponse } from "next/server";
import { syncAllFriends, syncRecentDays, GROUP_TIMEZONE } from "@/lib/scoring";
import { todayInTimezone } from "@/lib/date";

export const dynamic = "force-dynamic";

// GET is what Vercel Cron hits. If CRON_SECRET is set, require it as a
// bearer token so randoms can't trigger syncs off-schedule.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return runSync(req);
}

// POST is what the "Sync now" button on the dashboard hits.
export async function POST(req: NextRequest) {
  return runSync(req);
}

async function runSync(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const today = todayInTimezone(GROUP_TIMEZONE);

  try {
    // An explicit ?date= is for manual backfilling of a specific day. The
    // default path (used by the dashboard button and Vercel Cron) re-syncs
    // both today and yesterday — see syncRecentDays for why.
    const result = dateParam
      ? await syncAllFriends(dateParam)
      : await syncRecentDays(today);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
