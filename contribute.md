# Contributing a run: guidance for agents

This file is for an AI agent that is **submitting** a run to this repo: moving the delivered
file in, writing the manifest entry and opening the pull request. Humans can follow
[contribute.html](contribute.html) instead. Where this file and [prompts/RULES.md](prompts/RULES.md)
differ, RULES.md wins.

**Never give this file, RULES.md or anything else in this repo to the model being benchmarked.**
That model gets [prompts/v1.md](prompts/v1.md), pasted verbatim, in a new empty folder, and nothing
else. If you are the model being benchmarked and you can read this file, the run is invalid. Stop
and tell the operator.

## What you need before you start

The run must already be finished. You need:

- the delivered HTML file, exactly as the model wrote it (the **first** file it delivered)
- the session log or transcript, which is the source for every number in the manifest entry
- the operator's account of anything the log doesn't show, such as the effort setting or an
  interrupted run

If any of these are missing, write `null` for what they would have given you. Don't estimate.

## Checks before you touch the repo

Do each one and stop if it fails. A failed check is a question for the operator, not something to
work around.

1. **Prompt.** The text pasted into the session matches `prompts/v1.md`. Compare it against the
   transcript, not from memory. A trailing-newline difference is fine; say so in the PR. Anything
   else means the run was on a different prompt and can't go in as v1.
2. **Clean start.** The harness started in a new, empty folder that is not this repo, and the
   model read no other run's files.
3. **One attempt.** Use the first file the model delivered. If the operator kept prompting after
   that ("finish it", "fix the bug"), the later versions are not the entry. A rerun gets its own id.
4. **Unedited.** The file is byte-for-byte what the model wrote. Moving and renaming it is the only
   allowed change, so record its hash before you move it and check that it still matches after.
5. **Time limit.** The run stayed within 3 hours. If it ran over, the entry is whatever file existed
   at the 3-hour mark.

## Adding the run

1. **Pick the id:** `<model-slug>-<effort>-<yyyymmdd>`, for example `opus-5-5-high-20261016`.
   Leave out the effort if it isn't known for certain. Add `-b`, `-c` for more runs of the same
   model and effort on the same day. The id must match `^[a-z0-9][a-z0-9-]*-[0-9]{8}(-[b-z])?$`
   and must not already be in `manifest.json`.
2. **Branch** from an up-to-date `main`: `git switch -c add-run-<id> origin/main`.
3. **Add the file** at `runs/<id>/index.html`. Then check its hash:
   ```sh
   shasum -a 256 runs/<id>/index.html
   ```
4. **Append one entry** to the end of `runs` in `manifest.json`. Copy the most recent entry's
   layout (one line per field, objects inline) and fill it in as described in the next section.
   Don't change any other entry.
5. **Validate** the manifest against the schema:
   ```sh
   npx -p ajv-cli@5 -p ajv-formats@3 ajv validate --spec=draft2020 -c ajv-formats \
     -s manifest.schema.json -d manifest.json
   ```
6. **Look at it** (optional, but do it if you can run a browser). Start
   `python3 -m http.server 8000` in the repo root, open `http://localhost:8000`, and check that the
   entry is listed and renders, and that a click at the canvas centre starts a wiggle. Use this to set
  `first_try` (see below); don't use it to fix anything.
7. **Commit** the file and the manifest change together: `Add run: <model name>, prompt v1 (<id>)`.
8. **Open a pull request** against `main`, with the body described below.

## The manifest entry

| Field | What to write |
|---|---|
| `id` | The id from step 1. |
| `model.id` | The exact API model id, as the session log shows it (`claude-opus-5-5`, not "Opus 5.5"). |
| `model.name`, `model.provider` | Display name and provider. |
| `harness.name`, `harness.version` | The agent harness and its exact version, from the log. For a chat web app, name the app and tier (`ChatGPT (free tier)`) and use `null` for the version if it doesn't show one. |
| `effort` | The effort or thinking setting, using the harness's own name for it (`high`, `xhigh`). Use `null` if it isn't known for certain. |
| `date` | The day the run started, as `YYYY-MM-DD`. |
| `prompt_version` | `v1`. |
| `first_try` | `true` if the delivered file loads and renders with no edits. `false` if it doesn't, and the entry still goes in: failures are results. `null` if nobody checked. |
| `wall_min` | Minutes from the first prompt to the delivery, from the log's timestamps. If an outside pause (such as a usage limit) is left out, say so in `notes`. |
| `tokens.input`, `tokens.output` | Summed over every request in the session log. Input includes cache reads and cache writes. Give the breakdown in `notes`. |
| `cost_usd` | Only if the harness reported a cost. `null` for subscription runs or when it wasn't reported. Never work it out from a price list. |
| `file` | `runs/<id>/index.html`. |
| `sha256` | The hash from step 3. |
| `three_version` | The Three.js version the file loads, taken from its import URL, as `0.170.0`. |
| `params` | For v1: `{ "seed": true, "coat": { "red": "red", "sable": "sable", "tri": "tri", "bht": "bht" } }`. |
| `scores` | `null`. Scores are filled in at review, not by the submitter. |
| `notes` | Plain facts: how the run went, how each number was measured, what was checked and on what hardware, and anything unusual (pauses, operator messages after delivery, prompt differences). No opinions about quality. |

## The pull request

Title: `Add run: <model name>, prompt v1 (<id>)`.

In the body, give the evidence for each check, so the reviewer can confirm it without asking:

- the model id, effort and harness version, and where you read them
- how the prompt was verified against `prompts/v1.md`
- the file's sha256, and confirmation that it was only moved
- how wall time and tokens were measured
- what `first_try` is based on: browser, viewport and what you clicked
- anything that went differently from the rules above

## What not to do

- Don't edit the delivered file, including whitespace, formatting or a fix for an obvious bug.
- Don't add stills. After the merge, the "Run stills" GitHub Action captures any that are missing.
- Don't touch other entries, the prompts, the schema or the site pages in a run PR. Raise those
  changes separately.
- Don't add hosting, deployment or server material. This repo holds the benchmark and the static
  site only.
- Don't guess. A `null` is always better than a plausible number.
