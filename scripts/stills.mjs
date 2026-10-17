// Captures a still image of each run's 3D render, one per coat, into runs/<id>/stills/.
// The site shows these by default and only starts a live render when one is clicked.
//
//   node scripts/stills.mjs            capture stills that are missing
//   node scripts/stills.mjs --force    recapture every still
//   node scripts/stills.mjs <run-id>…  only these runs (missing stills, or all with --force)
//
// Needs Playwright with Chromium: npm install, then npx playwright install chromium.
import { createServer } from 'node:http';
import { readFile, mkdir, access } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const SEED = 1;            // same seed for every still, so the coats differ only in colour; index.html's STILL_SEED must match
const SETTLE_MS = 4000;    // time for three.js to load from the CDN and the scene to settle
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter(a => !a.startsWith('--'));

const manifest = JSON.parse(await readFile(join(ROOT, 'manifest.json'), 'utf8'));
const runs = manifest.runs.filter(r => !only.length || only.includes(r.id));
for (const id of only) if (!manifest.runs.some(r => r.id === id)) throw new Error(`No run called ${id} in manifest.json`);

// Serve the repo over http: some runs use import maps and module scripts, which file:// blocks.
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}/`;

// SwiftShader gives headless Chromium WebGL without a GPU, as on CI runners.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const exists = p => access(p).then(() => true, () => false);
let made = 0, failed = 0;

try {
  for (const run of runs) {
    const dir = join(ROOT, 'runs', run.id, 'stills');
    await mkdir(dir, { recursive: true });
    // "default" is the run with no coat asked for; the rest are the site's coat ids.
    const coats = [['default', null], ...Object.entries(run.params.coat || {})];
    for (const [coat, value] of coats) {
      const out = join(dir, coat + '.jpg');
      if (!force && await exists(out)) continue;
      const hash = [run.params.seed ? 'seed=' + SEED : null, value ? 'coat=' + value : null].filter(Boolean).join('&');
      // Same size the bench checks runs at, and the size of a pane on the site.
      const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 2 });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      try {
        await page.goto(origin + run.file + (hash ? '#' + hash : ''), { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(SETTLE_MS);
        await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
        made++;
        console.log(`${run.id} ${coat}${errors.length ? ' (page errors: ' + errors.join('; ') + ')' : ''}`);
      } catch (e) {
        failed++;
        console.error(`${run.id} ${coat}: ${e.message}`);
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`${made} still${made === 1 ? '' : 's'} captured${failed ? `, ${failed} failed` : ''}.`);
if (failed) process.exitCode = 1;
