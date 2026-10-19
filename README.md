# Corgi Tush Bench

One prompt, many models: each AI builds a wiggly 3D corgi rump as a single HTML file, and the site shows them live side by side at [corgibench.com](https://corgibench.com).

- The prompt: [prompts/v1.md](prompts/v1.md) (frozen). Runner rules: [prompts/RULES.md](prompts/RULES.md).
- Entries: [manifest.json](manifest.json), files in `runs/<id>/index.html`, unedited.
- To add a run, see [contribute.html](contribute.html) or the "Adding a run" section of RULES.md, then open a pull request. An agent submitting a run should follow [contribute.md](contribute.md).

## Checking your entry (optional)

Before opening a pull request, you can check that your entry shows up and loads:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Voting and the leaderboard need the live site's server, so they don't work here.

## Stills

The site shows a still image of each entry and only starts its live render when you click it, one at a time. The stills live in `runs/<id>/stills/` (one per coat) and are captured by `scripts/stills.mjs` in headless Chromium. Every run PR must include its stills: nothing generates them after merge, and a PR without them won't be accepted. To make them, run `npm install`, `npx playwright install chromium`, then `npm run stills -- <id>`, and commit `runs/<id>/stills/` with your entry (add `--force` to recapture).

## Voting

The live site runs blind A/B votes and turns them into Elo ratings per prompt version. A pair must be on screen for 5 seconds before a vote counts, each pair gets one vote, and each IP gets 120 votes an hour (stored only as a salted hash). Run files are public, so a determined voter could work out which model is which. Treat the ratings as a fun crowd signal, not a lab result.
