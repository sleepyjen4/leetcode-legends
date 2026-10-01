-- CreateTable
CREATE TABLE "SolvedProblem" (
    "friendId" TEXT NOT NULL,
    "titleSlug" TEXT NOT NULL,
    "firstAcceptedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolvedProblem_pkey" PRIMARY KEY ("friendId","titleSlug")
);

-- AddForeignKey
ALTER TABLE "SolvedProblem" ADD CONSTRAINT "SolvedProblem_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every problem already counted on a past day keeps that day.
INSERT INTO "SolvedProblem" ("friendId", "titleSlug", "firstAcceptedAt")
SELECT "friendId", slug, MIN("date")
FROM "DailyResult", unnest("problemSlugs") AS slug
GROUP BY "friendId", slug
ON CONFLICT DO NOTHING;
