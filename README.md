# Best Around

A standalone version of the Best Around rating app — same rubrics, sliders, leaderboard,
edit/delete, and rename tools as the Claude artifact version, but running as a real website
with its own domain and icon, backed by Supabase instead of Claude's built-in storage.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account/project.
2. Once the project is ready, open the **SQL Editor** and run this to create the table:

```sql
create table ratings (
  id uuid default gen_random_uuid() primary key,
  item_id text not null,
  venue text not null,
  rater text not null,
  scores jsonb not null,
  notes text default '',
  created_at timestamptz default now()
);

alter table ratings enable row level security;

create policy "Allow all access"
on ratings
for all
using (true)
with check (true);
```

That last policy is intentionally wide open — anyone with your app's link can read and write
ratings, no login required. That matches how the Claude-artifact version worked, and keeps
things simple for a friend group. If you ever want to lock it down later (e.g. requiring
sign-in), that's a Supabase Auth change to this policy, not a rewrite of the app.

3. Go to **Project Settings → API** and copy two values: the **Project URL** and the
   **anon public key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Open `.env` and paste in the two values from step 1.

## 3. Run it locally

```bash
npm install
npm run dev
```

This opens the app at `http://localhost:5173`. Try adding a rating to confirm it's writing to
Supabase (you can check the `ratings` table in the Supabase dashboard's Table Editor to see
rows appear).

## 4. Deploy it

Push this folder to a GitHub repo, then connect it to **Netlify** or **Vercel** (either works
the same way):

- Build command: `npm run build`
- Publish directory: `dist`
- Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the
  host's dashboard under project settings — don't rely on the `.env` file, since that's not
  committed to the repo.

Both Netlify and Vercel give you a free `something.netlify.app` / `something.vercel.app`
subdomain immediately after the first deploy.

## 5. Add a custom domain (optional)

Buy a domain from any registrar (Namecheap, Google Domains successor Squarespace Domains,
Cloudflare, etc. — roughly $10–15/year for a `.com`). Then in Netlify/Vercel's domain
settings, add your domain and follow their DNS instructions (usually just adding a couple of
DNS records at your registrar). Both platforms handle HTTPS automatically once that's done.

## 6. The icon

The `public/` folder already has `apple-touch-icon.png`, `icon-192.png`, and `icon-512.png` in
the app's own color palette, wired up in `index.html` and `manifest.json`. Once this is live
on its own domain, opening it in Safari and using **Add to Home Screen** will pick up this
icon instead of Claude's.

If you want a different icon design later, replace those three PNG files (same filenames,
same square aspect ratio) and redeploy — no code changes needed.

## What's different from the Claude artifact version

- Data lives in a real Postgres database (Supabase) instead of Claude's built-in artifact
  storage — this is what makes it work outside claude.ai at all.
- Your name is saved with the browser's own `localStorage` instead of Claude's storage API —
  functionally identical, just the standard web version of the same idea.
- Everything else — the six rubrics, hints, sliders, leaderboard math, edit/delete, rename,
  venue autocomplete, the home overview — is unchanged.

## Possible next steps

- **Live updates**: right now, everyone needs to refresh (or re-open the item) to see a
  rating someone else just added. Supabase supports realtime subscriptions, which would push
  new ratings to everyone's screen instantly — a reasonable next upgrade if it's worth it.
- **A real invite flow**: right now "invite-only" just means "people you send the link to."
  If that ever needs to be firmer, Supabase Auth (magic-link email sign-in) is the natural
  next step, using the same database.
