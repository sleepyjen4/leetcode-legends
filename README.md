# Leetcode Legends

A tracker for the deal: 3+ LeetCode points a day (easy=1, medium=2, hard=3) or it's $5 to the group. Verification is automatic — it reads each friend's public LeetCode activity, no manual check-in.

## How it works

- Everyone's added once (name + LeetCode username) on the `/manage` page. No login.
- A daily sync (automatic, via cron — see Deploying below) pulls each person's accepted submissions for the day from LeetCode's public API, looks up each problem's difficulty, and totals the points.
- The dashboard (`/`) shows who's done for today and who owes what. Each person's page (`/friend/[id]`) has their full history and a "mark $5 paid" button once someone actually settles up in real life.
- A day only counts as "missed" once it's over — today always shows "in progress" until the next sync finalizes it.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Get a Postgres database.** [Neon](https://neon.tech) — sign up, create a project, and copy both connection strings it gives you: the pooled one (default) and the direct one (toggle "Pooled connection" off, or swap `-pooler` out of the hostname).

3. **Set up your `.env`**

   ```bash
   cp .env.example .env
   ```

   Then fill in:
   - `DATABASE_URL` — the **pooled** connection string from step 2 (used at runtime)
   - `DIRECT_DATABASE_URL` — the **direct** (unpooled) connection string (used only by Prisma Migrate — pooled connections don't support the advisory lock migrations need)
   - `GROUP_TIMEZONE` — an IANA timezone name (e.g. `Australia/Sydney`, `America/New_York`) that the whole group's "day" gets scored against
   - leave `CRON_SECRET` blank locally

4. **Create the database tables**

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Run it**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000), go to **Manage friends**, and add everyone with their real LeetCode usernames. Then hit **Sync now** on the dashboard to pull real data.

## Notes

- The LeetCode data comes from LeetCode's public (unofficial) endpoints — no API key needed, but also no guarantee LeetCode won't change them. If syncing starts failing for everyone at once, that's the first place to check (`src/lib/leetcode.ts`).
- There's no auth — anyone with the link can view the dashboard and add/remove friends on `/manage`. That matches the "pick your name, we trust each other" spirit of the deal, but means don't share the link outside the group.
- **Windows: `npm install` fails with `EPERM ... query_engine-windows.dll.node`** if `npm run dev` is still running in another terminal — it holds the Prisma query engine file open, so `prisma generate` (which runs automatically via `postinstall`) can't overwrite it. Stop the dev server first, then retry `npm install`.
