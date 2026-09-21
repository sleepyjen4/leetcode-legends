"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { syncRecentDays, GROUP_TIMEZONE } from "./scoring";
import { todayInTimezone } from "./date";

export async function addFriend(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const leetcodeUsername = String(formData.get("leetcodeUsername") ?? "").trim();
  const discordId = String(formData.get("discordId") ?? "").trim();

  if (!name || !leetcodeUsername) {
    throw new Error("Name and LeetCode username are both required.");
  }

  await prisma.friend.create({
    data: { name, leetcodeUsername, discordId: discordId || null },
  });
  revalidatePath("/");
  revalidatePath("/manage");
}

export async function updateFriendDiscordId(friendId: string, formData: FormData) {
  const discordId = String(formData.get("discordId") ?? "").trim();

  await prisma.friend.update({
    where: { id: friendId },
    data: { discordId: discordId || null },
  });
  revalidatePath("/manage");
}

export async function deleteFriend(friendId: string) {
  await prisma.friend.delete({ where: { id: friendId } });
  revalidatePath("/");
  revalidatePath("/manage");
}

export async function markDebtPaid(resultId: string, paid: boolean) {
  await prisma.dailyResult.update({
    where: { id: resultId },
    data: { debtPaid: paid },
  });
  revalidatePath("/");
  revalidatePath("/friend/[id]", "page");
}

export async function triggerSyncNow() {
  const today = todayInTimezone(GROUP_TIMEZONE);
  await syncRecentDays(today);
  revalidatePath("/");
  revalidatePath("/friend/[id]", "page");
}
