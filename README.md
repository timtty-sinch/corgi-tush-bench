# Corgi Tush Bench

One prompt, many models: each AI builds a wiggly 3D corgi rump as a single HTML file, and the site shows them live side by side.

- The prompt: [prompts/v1.md](prompts/v1.md) (frozen). Runner rules: [prompts/RULES.md](prompts/RULES.md).
- Entries: [manifest.json](manifest.json), files in `runs/<id>/index.html`, unedited.
- To add a run, see [contribute.html](contribute.html) or the "Adding a run" section of RULES.md.

## Preview locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Two Cloudflare Pages projects build from this one repo. Model code is served from a separate origin and never shares the site's.

| Project | Build command | Output | Serves |
|---|---|---|---|
| `corgi-tush-bench` | `sh build.sh site` | `dist` | the website |
| `corgi-tush-runs` | `sh build.sh runs` | `dist` | `runs/` only, with a strict CSP |

If you use other project names or a custom domain, set `SITE_ORIGIN` and `RUNS_ORIGIN` as environment variables on **both** projects.

## Voting and leaderboard

Blind A/B votes go to `/api/match`, `/api/vote` and `/api/leaderboard` (Pages Functions in `functions/`, shared code in `lib/vote.js`). They're stored in a Cloudflare D1 database and turned into Elo ratings per prompt version.

One-time setup, on the **site project only**:

1. Create the database and its table:
   ```
   npx wrangler d1 create corgi-tush-votes
   npx wrangler d1 execute corgi-tush-votes --remote --file migrations/0001_votes.sql
   ```
2. In Cloudflare, open `corgi-tush-bench`, then Settings, then Bindings. Add a D1 database binding named `DB` pointing at `corgi-tush-votes`.
3. Under Settings, then Variables and secrets, add a secret named `VOTE_SECRET` set to a long random string (`openssl rand -hex 32`).
4. Redeploy.

Leave both out of `corgi-tush-runs`. Without them, the API routes on the runs origin return 404.

Abuse limits (in `lib/vote.js`):
- A pair must be on screen for 5 seconds before a vote counts.
- Each pair gets one vote, and pairs expire after an hour.
- Each IP gets 120 votes an hour. IPs are stored only as a salted hash.

Run files are public, so a determined voter could find out which model is which from the browser's developer tools. Treat the ratings as a fun crowd signal, not a lab result.

### Testing voting locally

`python3 -m http.server` can't run the API. Use Wrangler with a local-only `wrangler.toml`, which is git-ignored so it never affects deploys:

```
name = "corgi-local"
pages_build_output_dir = "dist"
compatibility_date = "2025-09-01"
[[d1_databases]]
binding = "DB"
database_name = "corgi-tush-votes"
database_id = "local"
```

Then run the runs in one terminal and the site in another:

```
python3 -m http.server 8001

SITE_ORIGIN=http://localhost:8788 RUNS_ORIGIN=http://localhost:8001 sh build.sh site
npx wrangler d1 execute corgi-tush-votes --local --file migrations/0001_votes.sql
npx wrangler pages dev --binding VOTE_SECRET=dev
```

Then open http://localhost:8788/?vote.
