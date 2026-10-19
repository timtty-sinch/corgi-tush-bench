// Captures a still image of each run's 3D render, one per coat, into runs/<id>/stills/.
// The site shows these by default and only starts a live render when one is clicked.
// Contributors run this on their own machine and commit the stills with their run.
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
const MIN_FRAMES = 2;      // frames a run must have drawn before it is frozen for the still
const SHOT_MS = 120000;    // limit on waiting for those frames, then on the screenshot; heavy runs draw slowly under SwiftShader
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

// SwiftShader renders WebGL on the CPU, so stills come out the same whatever GPU the contributor has.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const exists = p => access(p).then(() => true, () => false);

// Runs render in a requestAnimationFrame loop, and under SwiftShader a heavy run's frames keep every
// core busy, so a screenshot waits minutes behind them. This lets the script stop that loop once the
// scene is drawn: the screenshot then only composites the last frame.
function freezable() {
  const raf = window.requestAnimationFrame.bind(window);
  let frozen = false, last;
  const stills = window.__stills = { asked: false, frames: 0, freeze() { frozen = true; } };
  window.requestAnimationFrame = cb => {
    stills.asked = true;
    return raf(t => {
      if (frozen) return;
      if (t !== last) { last = t; stills.frames++; }
      cb(t);
    });
  };
}
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
      await page.addInitScript(freezable);
      try {
        await page.goto(origin + run.file + (hash ? '#' + hash : ''), { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(SETTLE_MS);
        // A run that never asks for a frame is taken as it stands.
        await page.waitForFunction(n => !__stills.asked || __stills.frames >= n, MIN_FRAMES, { timeout: SHOT_MS });
        await page.evaluate(() => __stills.freeze());
        await page.screenshot({ path: out, type: 'jpeg', quality: 82, timeout: SHOT_MS });
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
