// GET /api/match?v=v1 -> a blind pair: two entries from the same prompt version, one coat and seed for both.
import { json, enabled, notFound, loadManifest, votableVersions, signToken, COATS } from '../../lib/vote.js';

export async function onRequestGet(ctx) {
  const { env, request } = ctx;
  if (!enabled(env)) return notFound();
  const manifest = await loadManifest(ctx);
  const versions = votableVersions(manifest);
  const asked = new URL(request.url).searchParams.get('v');
  const v = versions.includes(asked) ? asked : versions[0];
  if (!v) return json({ error: 'There aren’t two entries on the same prompt yet, so there’s nothing to vote on.' }, { status: 409 });

  const runs = manifest.runs.filter(r => r.prompt_version === v);
  const { results } = await env.DB.prepare(
    'SELECT r, COUNT(*) AS n FROM (SELECT a AS r FROM votes WHERE prompt_version = ?1 UNION ALL SELECT b FROM votes WHERE prompt_version = ?1) GROUP BY r'
  ).bind(v).all();
  const games = Object.fromEntries(results.map(x => [x.r, x.n]));

  // Favour entries with fewer games so new ones get rated quickly.
  const pick = pool => {
    const w = pool.map(r => 1 / (1 + (games[r.id] || 0)));
    let x = Math.random() * w.reduce((s, n) => s + n, 0);
    for (let i = 0; i < pool.length; i++) if ((x -= w[i]) <= 0) return pool[i];
    return pool[pool.length - 1];
  };
  const a = pick(runs);
  const b = pick(runs.filter(r => r !== a));
  const coat = COATS[Math.floor(Math.random() * COATS.length)];
  const seed = Math.floor(Math.random() * 1e6);
  const token = await signToken({ t: crypto.randomUUID(), v, a: a.id, b: b.id, coat, seed, iat: Date.now() }, env.VOTE_SECRET);
  const side = r => ({ file: r.file, params: r.params });
  return json({ token, prompt_version: v, versions, coat, seed, left: side(a), right: side(b) });
}
