import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { GROUP_TIMEZONE } from "@/lib/scoring";
import { todayInTimezone, zonedMidnightUtc, formatDateLabel } from "@/lib/date";
import { DAILY_GOAL_POINTS, DEBT_PER_MISSED_DAY } from "@/lib/leetcode";
import { markDebtPaid } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function FriendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const friend = await prisma.friend.findUnique({
    where: { id },
    include: { results: { orderBy: { date: "desc" } } },
  });

  if (!friend) notFound();

  const todayStr = todayInTimezone(GROUP_TIMEZONE);
  const todayStart = zonedMidnightUtc(todayStr, GROUP_TIMEZONE);

  const owedDays = friend.results.filter(
    (r) => !r.metGoal && !r.debtPaid && r.date.getTime() < todayStart.getTime()
  ).length;
  const owed = owedDays * DEBT_PER_MISSED_DAY;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="mt-4 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{friend.name}</h1>
          <p className="text-sm text-neutral-500">@{friend.leetcodeUsername}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">Total owed</p>
          <p className={`text-xl font-semibold ${owed > 0 ? "text-red-600" : "text-green-600"}`}>
            ${owed}
          </p>
        </div>
      </div>

      {friend.results.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No synced days yet. Hit &quot;Sync now&quot; on the dashboard.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {friend.results.map((result) => {
            const isToday = result.date.getTime() === todayStart.getTime();
            return (
              <li key={result.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{formatDateLabel(result.date)}</p>
                  <p className="text-xs text-neutral-500">
                    {result.pointsEarned} pt{result.pointsEarned === 1 ? "" : "s"}
                    {result.problemSlugs.length > 0 && ` · ${result.problemSlugs.join(", ")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {result.metGoal ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      Done
                    </span>
                  ) : isToday ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      In progress
                    </span>
                  ) : (
                    <>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        Missed
                      </span>
                      <form
                        action={async () => {
                          "use server";
                          await markDebtPaid(result.id, !result.debtPaid);
                        }}
                      >
                        <button
                          type="submit"
                          className={`text-xs font-medium underline-offset-2 hover:underline ${
                            result.debtPaid ? "text-neutral-500" : "text-neutral-900"
                          }`}
                        >
                          {result.debtPaid ? "Paid ✓ (undo)" : "Mark $5 paid"}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-neutral-400">
        Goal is {DAILY_GOAL_POINTS}+ points/day (easy=1, medium=2, hard=3).
      </p>
    </main>
  );
}
