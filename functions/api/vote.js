// POST /api/vote {token, choice: 'left' | 'right' | 'tie'} -> records the vote and reveals both entries.
import { json, enabled, notFound, loadManifest, verifyToken, hashIp, MIN_VIEW_MS, MAX_AGE_MS, VOTES_PER_HOUR } from '../../lib/vote.js';

export async function onRequestPost(ctx) {
  const { env, request } = ctx;
  if (!enabled(env)) return notFound();
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Send the vote as JSON.' }, { status: 400 }); }

  const p = await verifyToken(body.token, env.VOTE_SECRET);
  if (!p) return json({ error: 'This pair isn’t valid. Load a new pair.' }, { status: 400 });
  const age = Date.now() - p.iat;
  if (age < MIN_VIEW_MS) return json({ error: 'Look at both for a few seconds first.' }, { status: 429 });
  if (age > MAX_AGE_MS) return json({ error: 'This pair expired. Load a new pair.' }, { status: 410 });
  const winner = { left: 'a', right: 'b', tie: 'tie' }[body.choice];
  if (!winner) return json({ error: 'Choose left, right or tie.' }, { status: 400 });

  const ipHash = await hashIp(request.headers.get('CF-Connecting-IP') || 'unknown', env.VOTE_SECRET);
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM votes WHERE ip_hash = ? AND created_at > ?')
    .bind(ipHash, Date.now() - 3600e3).first();
  if (n >= VOTES_PER_HOUR) return json({ error: 'That’s the voting limit for this hour. Try again later.' }, { status: 429 });

  try {
    await env.DB.prepare('INSERT INTO votes (token_id, prompt_version, a, b, winner, coat, seed, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(p.t, p.v, p.a, p.b, winner, p.coat, p.seed, ipHash, Date.now()).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e && e.message))) return json({ error: 'This pair already has a vote. Load a new pair.' }, { status: 409 });
    throw e;
  }

  const manifest = await loadManifest(ctx);
  const reveal = id => { const r = manifest.runs.find(x => x.id === id); return { id, name: r ? r.model.name : id }; };
  return json({ ok: true, left: reveal(p.a), right: reveal(p.b) });
}
