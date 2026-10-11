// Shared helpers for the voting functions (Cloudflare Pages Functions, Web Crypto only).

export const MIN_VIEW_MS = 5000;        // a pair must be on screen this long before a vote counts
export const MAX_AGE_MS = 60 * 60e3;    // pairs expire after an hour
export const VOTES_PER_HOUR = 120;      // per hashed IP
export const PROVISIONAL_GAMES = 20;    // fewer games than this = provisional rating
export const K = 24;                    // Elo K-factor
export const COATS = ['red', 'sable', 'tri', 'bht'];

const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const hmacKey = secret => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export async function signToken(payload, secret) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body));
  return body + '.' + b64u(sig);
}

export async function verifyToken(token, secret) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(sig), enc.encode(body));
    return ok ? JSON.parse(new TextDecoder().decode(unb64u(body))) : null;
  } catch { return null; }
}

export async function hashIp(ip, secret) {
  return b64u(await crypto.subtle.digest('SHA-256', enc.encode(secret + '|' + ip))).slice(0, 22);
}

export const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(init.headers || {}) },
});

// The runs project builds from the same repo and gets these functions too, but has no DB binding.
export const enabled = env => Boolean(env.DB && env.VOTE_SECRET);
export const notFound = () => new Response('Not found', { status: 404 });

export async function loadManifest({ env, request }) {
  const res = await env.ASSETS.fetch(new Request(new URL('/manifest.json', request.url)));
  return res.json();
}

// Prompt versions with at least two entries, newest first.
export function votableVersions(manifest) {
  const n = {};
  for (const r of manifest.runs) n[r.prompt_version] = (n[r.prompt_version] || 0) + 1;
  return Object.keys(n).filter(v => n[v] >= 2).sort((a, b) => +b.slice(1) - +a.slice(1));
}

// Replays votes in order. Every run in the version is listed, even with no games yet.
export function elo(runIds, votes) {
  const s = Object.fromEntries(runIds.map(id => [id, { id, rating: 1000, wins: 0, losses: 0, ties: 0 }]));
  for (const v of votes) {
    const A = s[v.a], B = s[v.b];
    if (!A || !B) continue;
    const ea = 1 / (1 + 10 ** ((B.rating - A.rating) / 400));
    const sa = v.winner === 'a' ? 1 : v.winner === 'b' ? 0 : 0.5;
    A.rating += K * (sa - ea);
    B.rating -= K * (sa - ea);
    if (sa === 1) { A.wins++; B.losses++; } else if (sa === 0) { A.losses++; B.wins++; } else { A.ties++; B.ties++; }
  }
  return Object.values(s)
    .map(r => ({ ...r, rating: Math.round(r.rating), games: r.wins + r.losses + r.ties }))
    .sort((a, b) => b.rating - a.rating || b.games - a.games);
}
