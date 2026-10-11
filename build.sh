#!/bin/sh
# Builds one of the two Cloudflare Pages projects into dist/.
#   sh build.sh site   -> the website (pages, manifest, prompts)
#   sh build.sh runs   -> the model-written run files, on their own origin
# Override the addresses with env vars if your project names or domain differ.
set -eu
SITE_ORIGIN="${SITE_ORIGIN:-https://corgi-tush-bench.pages.dev}"
RUNS_ORIGIN="${RUNS_ORIGIN:-https://corgi-tush-runs.pages.dev}"
SITE_ORIGIN="${SITE_ORIGIN%/}"; RUNS_ORIGIN="${RUNS_ORIGIN%/}"

rm -rf dist && mkdir -p dist
case "${1:-}" in
  site)
    cp index.html contribute.html compare.html manifest.json manifest.schema.json favicon.svg og.png dist/
    cp -R prompts dist/
    for f in dist/index.html dist/contribute.html; do
      sed -e "s#__RUNS_ORIGIN__#$RUNS_ORIGIN/#g" -e "s#__SITE_ORIGIN__#$SITE_ORIGIN#g" "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    done
    sed -e "s#__RUNS_ORIGIN__#$RUNS_ORIGIN#g" deploy/site_headers > dist/_headers
    ;;
  runs)
    mkdir -p dist/runs
    cp -R runs/. dist/runs/
    for d in dist/runs/*/; do cp "${d}index.html" "${d}download.html"; done
    sed -e "s#__SITE_ORIGIN__#$SITE_ORIGIN#g" deploy/runs_headers > dist/_headers
    printf '<!doctype html><meta http-equiv="refresh" content="0; url=%s/">' "$SITE_ORIGIN" > dist/index.html
    ;;
  *) echo "usage: sh build.sh site|runs" >&2; exit 1 ;;
esac
echo "built $1 into dist/ (site: $SITE_ORIGIN, runs: $RUNS_ORIGIN)"
