/*
  Warnings:

  - The primary key for the `NotificationLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `type` to the `NotificationLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Friend" ADD COLUMN     "discordId" TEXT;

-- AlterTable
ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_pkey",
ADD COLUMN     "type" TEXT NOT NULL,
ADD CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("date", "type");
