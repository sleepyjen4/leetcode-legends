import { prisma } from "./db";
import { zonedMidnightUtc } from "./date";
import { GROUP_TIMEZONE } from "./scoring";
import { DEBT_PER_MISSED_DAY, DAILY_GOAL_POINTS } from "./leetcode";

interface DailyOutcome {
  friend: string;
  discordId?: string | null;
  pointsEarned?: number;
  metGoal?: boolean;
  error?: string;
}

export function formatDailyMessage(
  dateStr: string,
  results: DailyOutcome[],
): string {
  const nameWidth = Math.max(...results.map((r) => r.friend.length), 4);

  const lines = results.map((r) => {
    const name = r.friend.padEnd(nameWidth);
    if (r.error) return `${name}  sync failed`;
    const pts = `${r.pointsEarned} pt${r.pointsEarned === 1 ? "" : "s"}`.padEnd(
      6,
    );
    const status = r.metGoal ? "done" : `missed, owes $${DEBT_PER_MISSED_DAY}`;
    return `${name}  ${pts}${status}`;
  });

  const missedCount = results.filter((r) => !r.error && !r.metGoal).length;
  const errorCount = results.filter((r) => r.error).length;

  const parts: string[] = [];
  if (missedCount > 0) parts.push(`${missedCount} missed`);
  if (errorCount > 0)
    parts.push(`${errorCount} sync error${errorCount === 1 ? "" : "s"}`);
  const summary =
    parts.length === 0
      ? "Everyone cleared today!!! 🎉"
      : `${parts.join(", ")} today.`;

  return [
    `### Here are the results from ${dateStr} 🔥 `,
    "```",
    ...lines,
    "```",
    summary,
  ].join("\n");
}

export function formatReminderMessage(results: DailyOutcome[]): string | null {
  const behind = results.filter((r) => !r.error && !r.metGoal);
  if (behind.length === 0) return null;

  const nameWidth = Math.max(...behind.map((r) => r.friend.length + 1), 4);
  const lines = behind.map((r) => {
    const name = `${r.friend}:`.padEnd(nameWidth);
    const remaining = DAILY_GOAL_POINTS - (r.pointsEarned ?? 0);
    return `💩 ${name}  ${r.pointsEarned ?? 0} pt${(r.pointsEarned ?? 0) === 1 ? "" : "s"} — ${remaining} more to go`;
  });

  const mentions = behind
    .map((r) => r.discordId)
    .filter((id): id is string => Boolean(id))
    .map((id) => `<@${id}>`)
    .join(" ");

  const footer = ["Get to coding!!", mentions].filter(Boolean).join(" ");

  return ["### Still need today's points 🥺🙏", ...lines, footer].join("\n");
}

async function postToWebhooks(text: string): Promise<void> {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;

  const sends: Promise<Response>[] = [];
  if (discordUrl) {
    sends.push(
      fetch(discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      }),
    );
  }
  await Promise.allSettled(sends);
}

async function claim(
  dateStr: string,
  type: "summary" | "reminder",
): Promise<boolean> {
  const date = zonedMidnightUtc(dateStr, GROUP_TIMEZONE);
  try {
    await prisma.notificationLog.create({ data: { date, type } });
    return true;
  } catch {
    return false; // already handled
  }
}

export async function notifyIfNeeded(
  dateStr: string,
  results: DailyOutcome[],
): Promise<void> {
  if (!process.env.DISCORD_WEBHOOK_URL && !process.env.SLACK_WEBHOOK_URL)
    return;
  if (!(await claim(dateStr, "summary"))) return;

  await postToWebhooks(formatDailyMessage(dateStr, results));
}

export async function notifyRemindersIfNeeded(
  dateStr: string,
  results: DailyOutcome[],
): Promise<void> {
  if (!process.env.DISCORD_WEBHOOK_URL && !process.env.SLACK_WEBHOOK_URL)
    return;
  if (!(await claim(dateStr, "reminder"))) return;

  const message = formatReminderMessage(results);
  if (!message) return; // nobody's behind — nothing to send

  await postToWebhooks(message);
}
