import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { GROUP_TIMEZONE, computeFriendStats } from "@/lib/scoring";
import { todayInTimezone, zonedMidnightUtc, formatDateLabel } from "@/lib/date";
import {
  DAILY_GOAL_POINTS,
  leetcodeProblemUrl,
  slugToTitle,
} from "@/lib/leetcode";
import { markDebtPaid } from "@/lib/actions";
import { StreakFlame } from "@/components/StreakFlame";

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

  const { owed, currentStreak } = computeFriendStats(friend.results, todayStr);

  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-5 py-14 sm:py-20">
      <Link
        href="/"
        className="rise-in inline-block font-mono text-xs tracking-widest text-text-muted uppercase transition-colors hover:text-legend"
      >
        ◂ back to standings
      </Link>

      <div
        className="rise-in mt-5 mb-10 flex items-end justify-between gap-4"
        style={{ animationDelay: "60ms" }}
      >
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold uppercase tracking-tight text-text-primary">
            {friend.name}
            {currentStreak >= 2 && <StreakFlame streak={currentStreak} />}
          </h1>
          <p className="mt-1 font-mono text-xs text-text-faint">
            @{friend.leetcodeUsername}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="border border-border bg-surface px-4 py-2.5 text-right">
            <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
              Total owed
            </p>
            <p
              className={`font-display text-2xl font-bold ${
                owed > 0 ? "text-bounty" : "text-legend"
              }`}
            >
              ${owed}
            </p>
          </div>
        </div>
      </div>

      {friend.results.length === 0 ? (
        <p
          className="rise-in font-mono text-sm text-text-muted"
          style={{ animationDelay: "120ms" }}
        >
          <span className="blink-cursor text-legend">
            &gt; no synced days yet
          </span>
          <br />
          Hit &quot;Sync now&quot; on the dashboard.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {friend.results.map((result, i) => {
            const isToday = result.date.getTime() === todayStart.getTime();
            return (
              <li
                key={result.id}
                className="rise-in flex items-start justify-between gap-4 border border-border bg-surface px-4 py-3.5"
                style={{ animationDelay: `${120 + i * 50}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold text-text-primary">
                    {formatDateLabel(result.date)}
                  </p>
                  <p className="font-mono text-xs text-text-faint">
                    {result.pointsEarned} pt
                    {result.pointsEarned === 1 ? "" : "s"}
                  </p>

                  {result.problemSlugs.length > 0 && (
                    <details className="group mt-1.5">
                      <summary className="cursor-pointer list-none font-mono text-xs text-text-muted transition-colors hover:text-legend">
                        <span className="mr-1 inline-block transition-transform duration-200 group-open:rotate-90">
                          ▸
                        </span>
                        {result.problemSlugs.length} problem
                        {result.problemSlugs.length === 1 ? "" : "s"}
                      </summary>
                      <ul className="mt-2 flex flex-col gap-1.5 border-l border-border pl-3">
                        {result.problemSlugs.map((slug: string) => (
                          <li key={slug}>
                            <a
                              href={leetcodeProblemUrl(slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-legend underline-offset-2 hover:underline"
                            >
                              {slugToTitle(slug)} ↗
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {result.metGoal ? (
                    <span className="border border-legend/40 bg-legend-dim px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-legend uppercase">
                      done
                    </span>
                  ) : isToday ? (
                    <span className="pulse-pending border border-pending/40 bg-pending-dim px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-pending uppercase">
                      in progress
                    </span>
                  ) : (
                    <>
                      <span className="border border-bounty/40 bg-bounty-dim px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-bounty uppercase">
                        missed
                      </span>
                      <form
                        action={async () => {
                          "use server";
                          await markDebtPaid(result.id, !result.debtPaid);
                        }}
                      >
                        <button
                          type="submit"
                          className={`font-mono text-[10px] font-bold tracking-widest uppercase underline-offset-4 hover:underline ${
                            result.debtPaid
                              ? "text-text-faint"
                              : "text-text-primary"
                          }`}
                        >
                          {result.debtPaid ? "paid ✓ (undo)" : "mark $5 paid"}
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

      <p className="mt-8 font-mono text-xs text-text-faint">
        Goal is {DAILY_GOAL_POINTS}+ points/day (easy=1, medium=2, hard=3).
      </p>
    </main>
  );
}
