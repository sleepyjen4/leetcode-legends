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

2. **Get a Postgres database.** The easiest free option is [Neon](https://neon.tech) — sign up, create a project, and copy the connection string it gives you. (This becomes the same database you'll use in production if you connect it through Vercel's Storage tab instead — either works.)

3. **Set up your `.env`**
   ```bash
   cp .env.example .env
   ```
   Then fill in:
   - `DATABASE_URL` — the connection string from step 2
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

## Deploying (so everyone can use it)

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), sign in, and import that repo as a new project.
3. In the project's **Storage** tab, create/connect a **Postgres** database — this sets `DATABASE_URL` for you automatically.
4. In **Settings → Environment Variables**, add:
   - `GROUP_TIMEZONE` — same as above
   - `CRON_SECRET` — any random string (e.g. run `openssl rand -hex 16`); this stops random people from triggering syncs by hitting the URL directly
5. Deploy. Vercel will run migrations automatically as part of the build (`npm run build` runs `prisma migrate deploy` first).
6. Vercel Cron (configured in [`vercel.json`](vercel.json)) will hit `/api/sync` once a day automatically — no extra setup needed. It defaults to 16:00 UTC; edit the `schedule` in `vercel.json` if you want it to run at a specific time relative to `GROUP_TIMEZONE` (cron schedules in `vercel.json` are always UTC).
7. Share the deployed URL with the group.

## Notes

- The LeetCode data comes from LeetCode's public (unofficial) endpoints — no API key needed, but also no guarantee LeetCode won't change them. If syncing starts failing for everyone at once, that's the first place to check (`src/lib/leetcode.ts`).
- There's no auth — anyone with the link can view the dashboard and add/remove friends on `/manage`. That matches the "pick your name, we trust each other" spirit of the deal, but means don't share the link outside the group.
