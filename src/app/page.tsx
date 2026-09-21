import Link from "next/link";
import { prisma } from "@/lib/db";
import { GROUP_TIMEZONE } from "@/lib/scoring";
import { todayInTimezone, zonedMidnightUtc } from "@/lib/date";
import { DAILY_GOAL_POINTS, DEBT_PER_MISSED_DAY } from "@/lib/leetcode";
import { triggerSyncNow } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const todayStr = todayInTimezone(GROUP_TIMEZONE);
  const todayStart = zonedMidnightUtc(todayStr, GROUP_TIMEZONE);

  const friends = await prisma.friend.findMany({
    include: { results: { orderBy: { date: "desc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leetcode Legends</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {DAILY_GOAL_POINTS}+ points a day, or it&apos;s ${DEBT_PER_MISSED_DAY} to the group. Auto-checked
            against LeetCode.
          </p>
        </div>
        <Link
          href="/manage"
          className="shrink-0 text-sm font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
        >
          Manage friends
        </Link>
      </header>

      <form action={triggerSyncNow} className="mb-6">
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Sync now
        </button>
      </form>

      {friends.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
          No friends added yet.{" "}
          <Link href="/manage" className="underline">
            Add the group
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {friends.map((friend) => {
            const todayResult = friend.results.find(
              (r) => r.date.getTime() === todayStart.getTime()
            );
            const owedDays = friend.results.filter(
              (r) => !r.metGoal && !r.debtPaid && r.date.getTime() < todayStart.getTime()
            ).length;
            const owed = owedDays * DEBT_PER_MISSED_DAY;

            let statusLabel: string;
            let statusClass: string;
            if (!todayResult) {
              statusLabel = "Not synced yet";
              statusClass = "bg-neutral-100 text-neutral-500";
            } else if (todayResult.metGoal) {
              statusLabel = `Done · ${todayResult.pointsEarned} pts`;
              statusClass = "bg-green-100 text-green-700";
            } else {
              statusLabel = `In progress · ${todayResult.pointsEarned}/${DAILY_GOAL_POINTS} pts`;
              statusClass = "bg-amber-100 text-amber-700";
            }

            return (
              <li key={friend.id}>
                <Link
                  href={`/friend/${friend.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium">{friend.name}</p>
                    <p className="text-xs text-neutral-500">@{friend.leetcodeUsername}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {owed > 0 && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        owes ${owed}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
