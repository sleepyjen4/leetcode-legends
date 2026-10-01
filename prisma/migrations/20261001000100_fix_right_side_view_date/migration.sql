-- One-off data fix: sleepycatt0 first solved binary-tree-right-side-view on
-- Sep 29, but a re-submission on Sep 30 moved it there (before SolvedProblem
-- existed). Move it back. No-op if the data doesn't match.
WITH moved AS (
    SELECT r."id", r."friendId", r."date"
    FROM "DailyResult" r
    JOIN "Friend" f ON f."id" = r."friendId"
    WHERE f."leetcodeUsername" = 'sleepycatt0'
      AND 'binary-tree-right-side-view' = ANY(r."problemSlugs")
      AND r."date" >= '2026-09-29' AND r."date" < '2026-10-02'
),
solved AS (
    INSERT INTO "SolvedProblem" ("friendId", "titleSlug", "firstAcceptedAt")
    SELECT "friendId", 'binary-tree-right-side-view', "date" - INTERVAL '12 hours'
    FROM moved
    ON CONFLICT ("friendId", "titleSlug")
    DO UPDATE SET "firstAcceptedAt" = EXCLUDED."firstAcceptedAt"
),
removed AS (
    UPDATE "DailyResult" r
    SET "problemSlugs" = array_remove(r."problemSlugs", 'binary-tree-right-side-view'),
        "pointsEarned" = r."pointsEarned" - 2,
        "metGoal" = r."pointsEarned" - 2 >= 3
    FROM moved
    WHERE r."id" = moved."id"
)
UPDATE "DailyResult" r
SET "problemSlugs" = array_append(r."problemSlugs", 'binary-tree-right-side-view'),
    "pointsEarned" = r."pointsEarned" + 2,
    "metGoal" = r."pointsEarned" + 2 >= 3
FROM moved
WHERE r."friendId" = moved."friendId"
  AND r."date" = moved."date" - INTERVAL '1 day'
  AND NOT ('binary-tree-right-side-view' = ANY(r."problemSlugs"));
