import { prisma } from "./db";
import { zonedMidnightUtc } from "./date";
import { GROUP_TIMEZONE } from "./scoring";
import { DEBT_PER_MISSED_DAY } from "./leetcode";

interface DailyOutcome {
  friend: string;
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

async function postToWebhooks(text: string): Promise<void> {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  const slackUrl = process.env.SLACK_WEBHOOK_URL;

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
  if (slackUrl) {
    sends.push(
      fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }),
    );
  }
  await Promise.allSettled(sends);
}

export async function notifyIfNeeded(
  dateStr: string,
  results: DailyOutcome[],
): Promise<void> {
  if (!process.env.DISCORD_WEBHOOK_URL && !process.env.SLACK_WEBHOOK_URL)
    return;

  const date = zonedMidnightUtc(dateStr, GROUP_TIMEZONE);
  try {
    await prisma.notificationLog.create({ data: { date } });
  } catch {
    return; // already notified for this date
  }

  await postToWebhooks(formatDailyMessage(dateStr, results));
}
