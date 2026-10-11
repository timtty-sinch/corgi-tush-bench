// GET /api/leaderboard?v=v1 -> Elo ratings for every entry on that prompt version.
import { json, enabled, notFound, loadManifest, votableVersions, elo, PROVISIONAL_GAMES } from '../../lib/vote.js';

export async function onRequestGet(ctx) {
  const { env, request } = ctx;
  if (!enabled(env)) return notFound();
  const manifest = await loadManifest(ctx);
  const versions = votableVersions(manifest);
  const asked = new URL(request.url).searchParams.get('v');
  const v = versions.includes(asked) ? asked : versions[0];
  if (!v) return json({ versions, v: null, total_votes: 0, provisional_games: PROVISIONAL_GAMES, rows: [] });

  const runs = manifest.runs.filter(r => r.prompt_version === v);
  const { results } = await env.DB.prepare('SELECT a, b, winner FROM votes WHERE prompt_version = ? ORDER BY id').bind(v).all();
  const rows = elo(runs.map(r => r.id), results).map(r => {
    const run = runs.find(x => x.id === r.id);
    return { ...r, name: run.model.name, effort: run.effort, provisional: r.games < PROVISIONAL_GAMES };
  });
  return json({ versions, v, total_votes: results.length, provisional_games: PROVISIONAL_GAMES, rows },
    { headers: { 'cache-control': 'public, max-age=30' } });
}
