import { NextRequest, NextResponse } from "next/server";
import { syncAllFriends, GROUP_TIMEZONE } from "@/lib/scoring";
import { todayInTimezone } from "@/lib/date";
import { notifyRemindersIfNeeded } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const today = todayInTimezone(GROUP_TIMEZONE);

  try {
    const result = await syncAllFriends(today);
    await notifyRemindersIfNeeded(today, result.results);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
