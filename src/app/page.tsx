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

  const friendsRaw = await prisma.friend.findMany({
    include: { results: { orderBy: { date: "desc" } } },
    orderBy: { name: "asc" },
  });

  const board = friendsRaw
    .map((friend) => {
      const todayResult = friend.results.find(
        (r) => r.date.getTime() === todayStart.getTime()
      );
      const owedDays = friend.results.filter(
        (r) => !r.metGoal && !r.debtPaid && r.date.getTime() < todayStart.getTime()
      ).length;
      return {
        friend,
        todayResult,
        owed: owedDays * DEBT_PER_MISSED_DAY,
      };
    })
    .sort((a, b) => (b.todayResult?.pointsEarned ?? -1) - (a.todayResult?.pointsEarned ?? -1));

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:py-20">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="rise-in">
          <p className="font-mono text-xs tracking-[0.3em] text-legend uppercase">
            {"// the deal"}
          </p>
          <h1 className="title-flicker mt-2 font-display text-4xl font-bold uppercase tracking-tight text-text-primary sm:text-5xl">
            Leetcode{" "}
            <span className="bg-gradient-to-r from-legend to-pending bg-clip-text text-transparent">
              Legends
            </span>
          </h1>
          <p className="mt-3 max-w-md font-mono text-sm text-text-muted">
            {DAILY_GOAL_POINTS}+ points a day or it&apos;s ${DEBT_PER_MISSED_DAY} to the
            group. Auto-verified against LeetCode &mdash; no excuses, no honor system.
          </p>
        </div>
        <Link
          href="/manage"
          className="rise-in shrink-0 self-start font-mono text-xs tracking-widest text-text-muted uppercase transition-colors hover:text-legend sm:self-end"
          style={{ animationDelay: "80ms" }}
        >
          [ manage roster ]
        </Link>
      </header>

      <form action={triggerSyncNow} className="rise-in mb-8" style={{ animationDelay: "120ms" }}>
        <button
          type="submit"
          className="group relative overflow-hidden border border-border-strong bg-surface px-5 py-2.5 font-mono text-xs font-bold tracking-[0.2em] text-legend uppercase transition-all hover:bg-legend-dim hover:shadow-[0_0_20px_rgba(93,255,160,0.25)]"
        >
          <span className="relative z-10">▸ sync now</span>
        </button>
      </form>

      <div className="rise-in mb-3 flex items-baseline justify-between" style={{ animationDelay: "160ms" }}>
        <h2 className="font-display text-sm font-semibold tracking-[0.25em] text-text-muted uppercase">
          Today&apos;s Standings
        </h2>
        <span className="font-mono text-xs text-text-faint">{todayStr}</span>
      </div>

      {board.length === 0 ? (
        <p
          className="rise-in border border-dashed border-border bg-surface/50 p-8 font-mono text-sm text-text-muted"
          style={{ animationDelay: "200ms" }}
        >
          <span className="blink-cursor text-legend">&gt; no legends yet</span>
          <br />
          <Link href="/manage" className="mt-2 inline-block text-legend underline underline-offset-4">
            recruit the group
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {board.map(({ friend, todayResult, owed }, i) => {
            let statusLabel: string;
            let statusClass: string;
            let animatePending = false;
            if (!todayResult) {
              statusLabel = "awaiting sync";
              statusClass = "border-border text-text-faint";
            } else if (todayResult.metGoal) {
              statusLabel = "done";
              statusClass = "border-legend/40 bg-legend-dim text-legend";
            } else {
              statusLabel = "in progress";
              statusClass = "border-pending/40 bg-pending-dim text-pending";
              animatePending = true;
            }

            return (
              <li
                key={friend.id}
                className="rise-in"
                style={{ animationDelay: `${200 + i * 70}ms` }}
              >
                <Link
                  href={`/friend/${friend.id}`}
                  className="group flex items-center gap-4 border border-border bg-surface px-4 py-3.5 transition-all hover:border-border-strong hover:bg-surface-hover"
                >
                  <span
                    className={`hex-badge flex h-9 w-9 shrink-0 items-center justify-center font-display text-sm font-bold ${
                      i === 0 ? "bg-pending text-bg" : "bg-white/10 text-text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold text-text-primary">
                      {friend.name}
                    </p>
                    <p className="truncate font-mono text-xs text-text-faint">
                      @{friend.leetcodeUsername}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {owed > 0 && (
                      <span className="border border-bounty/40 bg-bounty-dim px-2 py-1 font-mono text-xs font-bold tracking-wide text-bounty">
                        owes ${owed}
                      </span>
                    )}
                    <div className="text-right">
                      <span
                        className={`inline-block border px-2 py-1 font-mono text-[10px] font-bold tracking-widest uppercase ${statusClass} ${
                          animatePending ? "pulse-pending" : ""
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <p className="mt-1 font-mono text-xs text-text-muted">
                        {todayResult ? `${todayResult.pointsEarned} pt` : "—"}
                        {todayResult && todayResult.pointsEarned !== 1 ? "s" : ""}
                      </p>
                    </div>
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
