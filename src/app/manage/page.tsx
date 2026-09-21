import Link from "next/link";
import { prisma } from "@/lib/db";
import { addFriend, deleteFriend } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const friends = await prisma.friend.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Back to dashboard
      </Link>

      <h1 className="mt-4 mb-6 text-2xl font-semibold tracking-tight">Manage friends</h1>

      <form
        action={addFriend}
        className="mb-8 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="name" className="block text-xs font-medium text-neutral-500">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Jen"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="leetcodeUsername" className="block text-xs font-medium text-neutral-500">
            LeetCode username
          </label>
          <input
            id="leetcodeUsername"
            name="leetcodeUsername"
            required
            placeholder="jen-codes"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Add
        </button>
      </form>

      {friends.length === 0 ? (
        <p className="text-sm text-neutral-500">No friends added yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {friends.map((friend) => (
            <li key={friend.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{friend.name}</p>
                <p className="text-xs text-neutral-500">@{friend.leetcodeUsername}</p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteFriend(friend.id);
                }}
              >
                <button
                  type="submit"
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
