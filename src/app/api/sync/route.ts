import { NextRequest, NextResponse } from "next/server";
import { syncAllFriends, syncRecentDays, GROUP_TIMEZONE } from "@/lib/scoring";
import { todayInTimezone, addDays } from "@/lib/date";
import { notifyIfNeeded } from "@/lib/notify";

export const dynamic = "force-dynamic";

// GET is what Vercel Cron hits daily. If CRON_SECRET is set, require it as a
// bearer token so randoms can't trigger syncs (or the Discord/Slack post)
// off-schedule. This is also the only path that posts the daily webhook
// notification — the dashboard's "Sync now" button calls syncRecentDays
// directly as a server action (see actions.ts) and never hits this route, so
// clicking it repeatedly during the day never spams the group chat.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const result = await runSync(dateParam);
  if ("error" in result) {
    return NextResponse.json(result, { status: 500 });
  }

  // Only notify for the standard daily flow, not a manual ?date= backfill.
  if (!dateParam && "yesterday" in result) {
    const today = todayInTimezone(GROUP_TIMEZONE);
    const yesterdayStr = addDays(today, -1);
    await notifyIfNeeded(yesterdayStr, result.yesterday.results);
  }

  return NextResponse.json(result);
}

// POST is available for manual/scripted syncs (e.g. backfilling a specific
// ?date=) but nothing in the UI calls it — the dashboard uses a server
// action instead. Never sends the webhook notification.
export async function POST(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const result = await runSync(dateParam);
  return "error" in result
    ? NextResponse.json(result, { status: 500 })
    : NextResponse.json(result);
}

async function runSync(dateParam: string | null) {
  const today = todayInTimezone(GROUP_TIMEZONE);

  try {
    // An explicit ?date= is for manual backfilling of a specific day. The
    // default path (used by Vercel Cron) re-syncs both today and yesterday
    // — see syncRecentDays for why.
    return dateParam ? await syncAllFriends(dateParam) : await syncRecentDays(today);
  } catch (err) {
    return { error: (err as Error).message };
  }
}
