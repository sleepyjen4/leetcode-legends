// Thin client around LeetCode's public (unofficial) endpoints. No auth
// required for public profile data. Field names come from the widely-used
// community reverse-engineering of these endpoints; LeetCode could change
// them without notice, so failures here should surface clearly rather than
// silently scoring someone a zero.

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

export interface RecentAcSubmission {
  titleSlug: string;
  timestamp: string; // unix seconds, as a string
}

export async function fetchRecentAcSubmissions(
  username: string,
  limit = 50
): Promise<RecentAcSubmission[]> {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        titleSlug
        timestamp
      }
    }
  `;
  const res = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { username, limit } }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`LeetCode API returned ${res.status} for user "${username}"`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(
      `LeetCode API error for user "${username}": ${JSON.stringify(json.errors)}`
    );
  }
  return json.data?.recentAcSubmissionList ?? [];
}

interface AllProblemsResponse {
  stat_status_pairs: {
    stat: { question__title_slug: string };
    difficulty: { level: number }; // 1=Easy, 2=Medium, 3=Hard
  }[];
}

const DIFFICULTY_BY_LEVEL: Record<number, "Easy" | "Medium" | "Hard"> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

export async function fetchAllProblemDifficulties(): Promise<
  Map<string, "Easy" | "Medium" | "Hard">
> {
  const res = await fetch("https://leetcode.com/api/problems/all/", {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`LeetCode problems list returned ${res.status}`);
  }
  const json: AllProblemsResponse = await res.json();
  const map = new Map<string, "Easy" | "Medium" | "Hard">();
  for (const p of json.stat_status_pairs) {
    map.set(p.stat.question__title_slug, DIFFICULTY_BY_LEVEL[p.difficulty.level] ?? "Easy");
  }
  return map;
}

export const POINTS_BY_DIFFICULTY: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

export const DAILY_GOAL_POINTS = 3;
export const DEBT_PER_MISSED_DAY = 5;
