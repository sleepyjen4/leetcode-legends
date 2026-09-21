import Link from "next/link";
import { prisma } from "@/lib/db";
import { addFriend, deleteFriend } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const friends = await prisma.friend.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-5 py-14 sm:py-20">
      <Link
        href="/"
        className="rise-in inline-block font-mono text-xs tracking-widest text-text-muted uppercase transition-colors hover:text-legend"
      >
        ◂ back to standings
      </Link>

      <h1
        className="rise-in mt-5 mb-8 font-display text-3xl font-bold uppercase tracking-tight text-text-primary"
        style={{ animationDelay: "60ms" }}
      >
        Manage Roster
      </h1>

      <form
        action={addFriend}
        className="rise-in mb-10 flex flex-col gap-4 border border-border bg-surface p-5 sm:flex-row sm:items-end"
        style={{ animationDelay: "120ms" }}
      >
        <div className="flex-1">
          <label
            htmlFor="name"
            className="block font-mono text-[10px] tracking-widest text-text-muted uppercase"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Jen"
            className="mt-1.5 w-full border border-border bg-bg px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-faint focus:border-legend"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="leetcodeUsername"
            className="block font-mono text-[10px] tracking-widest text-text-muted uppercase"
          >
            LeetCode username
          </label>
          <input
            id="leetcodeUsername"
            name="leetcodeUsername"
            required
            placeholder="jen-codes"
            className="mt-1.5 w-full border border-border bg-bg px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-faint focus:border-legend"
          />
        </div>
        <button
          type="submit"
          className="border border-border-strong bg-legend-dim px-5 py-2 font-mono text-xs font-bold tracking-[0.2em] text-legend uppercase transition-all hover:shadow-[0_0_20px_rgba(93,255,160,0.25)]"
        >
          + add
        </button>
      </form>

      {friends.length === 0 ? (
        <p className="rise-in font-mono text-sm text-text-muted" style={{ animationDelay: "180ms" }}>
          <span className="blink-cursor text-legend">&gt; roster empty</span>
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {friends.map((friend, i) => (
            <li
              key={friend.id}
              className="rise-in flex items-center justify-between gap-4 border border-border bg-surface px-4 py-3"
              style={{ animationDelay: `${180 + i * 60}ms` }}
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-text-primary">
                  {friend.name}
                </p>
                <p className="truncate font-mono text-xs text-text-faint">
                  @{friend.leetcodeUsername}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteFriend(friend.id);
                }}
              >
                <button
                  type="submit"
                  className="shrink-0 border border-bounty/30 px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-bounty uppercase transition-colors hover:bg-bounty-dim"
                >
                  remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
