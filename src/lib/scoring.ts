import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import {
  fetchAllProblemDifficulties,
  fetchRecentAcSubmissions,
  POINTS_BY_DIFFICULTY,
  DAILY_GOAL_POINTS,
  DEBT_PER_MISSED_DAY,
} from "./leetcode";
import { zonedMidnightUtc, addDays, formatDateInTimezone } from "./date";

export const GROUP_TIMEZONE = process.env.GROUP_TIMEZONE || "UTC";

const CACHE_STALE_MS = 7 * 24 * 60 * 60 * 1000;

// ~4000 LeetCode problems. One upsert query per row (the previous approach)
// meant thousands of round trips to Neon's serverless Postgres, which was
// slow enough to hit the connection's idle/statement timeout mid-transaction.
// A single multi-row INSERT ... ON CONFLICT per batch does the same work in
// a handful of round trips.
export async function refreshProblemCache(): Promise<void> {
  const map = await fetchAllProblemDifficulties();
  const entries = Array.from(map.entries());

  const BATCH_SIZE = 1000;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const rows = Prisma.join(
      batch.map(([titleSlug, difficulty]) => Prisma.sql`(${titleSlug}, ${difficulty}, now())`)
    );
    await prisma.$executeRaw`
      INSERT INTO "ProblemCache" ("titleSlug", "difficulty", "updatedAt")
      VALUES ${rows}
      ON CONFLICT ("titleSlug")
      DO UPDATE SET "difficulty" = EXCLUDED."difficulty", "updatedAt" = now()
    `;
  }
}

export async function ensureProblemCache(): Promise<void> {
  const mostRecent = await prisma.problemCache.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!mostRecent || Date.now() - mostRecent.updatedAt.getTime() > CACHE_STALE_MS) {
    await refreshProblemCache();
  }
}

async function difficultyFor(titleSlug: string): Promise<string> {
  const cached = await prisma.problemCache.findUnique({ where: { titleSlug } });
  // Fall back to Easy (1pt) if a slug is missing from the cache rather than
  // dropping the submission entirely — the next weekly refresh will correct it.
  return cached?.difficulty ?? "Easy";
}

export interface SyncResult {
  pointsEarned: number;
  metGoal: boolean;
  problemSlugs: string[];
}

export async function syncFriendForDate(
  friend: { id: string; leetcodeUsername: string },
  dateStr: string
): Promise<SyncResult> {
  const dayStart = zonedMidnightUtc(dateStr, GROUP_TIMEZONE);
  const dayEnd = zonedMidnightUtc(addDays(dateStr, 1), GROUP_TIMEZONE);

  const submissions = await fetchRecentAcSubmissions(friend.leetcodeUsername, 50);
  const slugsToday = new Set<string>();
  for (const s of submissions) {
    const ts = new Date(Number(s.timestamp) * 1000);
    if (ts >= dayStart && ts < dayEnd) {
      slugsToday.add(s.titleSlug);
    }
  }

  let pointsEarned = 0;
  const problemSlugs: string[] = [];
  for (const slug of slugsToday) {
    const difficulty = await difficultyFor(slug);
    pointsEarned += POINTS_BY_DIFFICULTY[difficulty] ?? 1;
    problemSlugs.push(slug);
  }

  const metGoal = pointsEarned >= DAILY_GOAL_POINTS;

  await prisma.dailyResult.upsert({
    where: { friendId_date: { friendId: friend.id, date: dayStart } },
    update: { pointsEarned, problemSlugs, metGoal },
    create: {
      friendId: friend.id,
      date: dayStart,
      pointsEarned,
      problemSlugs,
      metGoal,
    },
  });

  return { pointsEarned, metGoal, problemSlugs };
}

export async function syncAllFriends(dateStr: string) {
  await ensureProblemCache();
  const friends = await prisma.friend.findMany();

  const results = [];
  for (const friend of friends) {
    try {
      const result = await syncFriendForDate(friend, dateStr);
      results.push({ friend: friend.name, ...result });
    } catch (err) {
      results.push({ friend: friend.name, error: (err as Error).message });
    }
  }
  return { date: dateStr, results };
}

// Re-syncs both "today" and "yesterday" every time it's called. Yesterday is
// re-checked (not just today) because the deal's deadline is lenient about
// going past midnight — a submission logged at 12:20am should still count
// toward the previous day even if a sync already ran before that happened.
export async function syncRecentDays(todayStr: string) {
  const yesterdayStr = addDays(todayStr, -1);
  const [yesterday, today] = await Promise.all([
    syncAllFriends(yesterdayStr),
    syncAllFriends(todayStr),
  ]);
  return { yesterday, today };
}

interface ResultLike {
  date: Date;
  metGoal: boolean;
  debtPaid: boolean;
  pointsEarned: number;
}

export interface FriendStats {
  todayResult: ResultLike | undefined;
  owed: number;
  currentStreak: number;
}

// Centralizes the derived stats both the dashboard and the friend page need
// from a friend's DailyResult history, so "today's status", "$ owed", and
// "current streak" are all computed the same way in one place.
export function computeFriendStats(results: ResultLike[], todayStr: string): FriendStats {
  const todayStart = zonedMidnightUtc(todayStr, GROUP_TIMEZONE);
  const todayResult = results.find((r) => r.date.getTime() === todayStart.getTime());

  const owedDays = results.filter(
    (r) => !r.metGoal && !r.debtPaid && r.date.getTime() < todayStart.getTime()
  ).length;

  const metByDate = new Map<string, boolean>();
  for (const r of results) {
    metByDate.set(formatDateInTimezone(r.date, GROUP_TIMEZONE), r.metGoal);
  }

  let currentStreak = 0;
  let cursor = metByDate.get(todayStr) ? todayStr : addDays(todayStr, -1);
  while (metByDate.get(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  return { todayResult, owed: owedDays * DEBT_PER_MISSED_DAY, currentStreak };
}
