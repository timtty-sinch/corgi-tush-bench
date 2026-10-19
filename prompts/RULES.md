# Runner rules

These are for whoever runs a model on the benchmark. Never paste them into the prompt.

## Prompt versions

| Version | File | sha256 | Status |
|---|---|---|---|
| v0 | v0.md | `d58c6a935627ac5d82403e3261df8375e79877275e34f2952e917e82b2230ff3` | Draft. The two existing runs (opus55-high, sonet55) used it. |
| v1 | v1.md | `bcbbe7b82a7e488ae3a4186c30e9bfdacfcbe74329dee17774c7d69a7506d546` | **Frozen.** Use for all new runs. |

Paste the prompt file verbatim, with nothing added, removed or reworded. Any change, even a typo fix, makes a new version (v2.md) with a new hash. Runs are only ranked against runs on the same version.

### What changed from v0 to v1
- **Rule 4:** the "underside" became the low view from just above the ground, which no longer conflicts with the ground plane.
- **Rule 5:** a click at the canvas centre must hit the dog, so scripts can trigger wiggles.
- **Rule 7 (new):** one seeded RNG, plus `#seed=N&coat=red|sable|tri|bht` with fixed coat names.
- **Rule 9:** orbit limits are explicit: 360 degrees horizontally, about 3 to 70 degrees vertically.
- **Rule 10:** the container is an iframe.
- **Rule 11:** a reference machine for 60 fps, and quality reduction on it counts against the result.

## Running a model
1. **Fresh, empty folder per run.** Start the harness in a new empty directory. Never put it in this repo or near other runs' output, because "don't read anything else" can't be enforced if other runs are visible.
2. **One attempt.** The first file the model delivers is the entry. If it fails to load, record `first_try: false`. A rerun is a new entry with a new id, never a replacement.
3. **Record for the manifest:**
   - exact model id, provider and harness (name and version)
   - effort or thinking setting
   - date and prompt version
   - wall-clock minutes
   - input/output tokens and cost in USD, if the harness reports them
   - first_try
4. **No human edits** to the delivered file. The only allowed change is moving it to `runs/<id>/index.html`.
5. **Time limit:** 2 hours, extendable to 3 at the model's discretion. Stop the run at 3 hours and take whatever file exists.

## Run id
Use `<model-slug>-<effort>-<yyyymmdd>`, e.g. `opus-5-5-high-20261009`. Leave out the effort part if it's unknown (`sonnet-5-5-20261009`). Never guess it. Add `-b`, `-c` for repeat runs on the same day.

## Adding a run
1. Put the delivered file at `runs/<id>/index.html`, unedited.
2. Add an entry to `manifest.json` (see `manifest.schema.json`). Set `sha256` to the file's hash (`shasum -a 256 runs/<id>/index.html`), and use `null` for anything you don't know.
3. For v1 runs, set `params` to `{"seed": true, "coat": {"red":"red","sable":"sable","tri":"tri","bht":"bht"}}`. Only v0 runs need a custom coat map.
4. Capture the stills locally with `npm run stills -- <id>` (after `npm install` and `npx playwright install chromium`) and commit `runs/<id>/stills/` with the entry. PRs without stills are not accepted.
