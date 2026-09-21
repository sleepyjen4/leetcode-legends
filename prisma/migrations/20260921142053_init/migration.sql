-- CreateTable
CREATE TABLE "Friend" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leetcodeUsername" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyResult" (
    "id" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "problemSlugs" TEXT[],
    "metGoal" BOOLEAN NOT NULL,
    "debtPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemCache" (
    "titleSlug" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemCache_pkey" PRIMARY KEY ("titleSlug")
);

-- CreateIndex
CREATE UNIQUE INDEX "Friend_leetcodeUsername_key" ON "Friend"("leetcodeUsername");

-- CreateIndex
CREATE UNIQUE INDEX "DailyResult_friendId_date_key" ON "DailyResult"("friendId", "date");

-- AddForeignKey
ALTER TABLE "DailyResult" ADD CONSTRAINT "DailyResult_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
