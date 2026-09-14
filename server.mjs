import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getGame } from './public/catalog.js';
import { JsonStateStore } from './lib/json-store.mjs';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const PRESENCE_TTL_MS = 15_000;
const SCORE_LIMIT = 100_000;
const STATE_FILE = process.env.EGGVERSE_STATE_FILE || join(process.cwd(), '.data', 'state.json');
const store = new JsonStateStore(STATE_FILE);
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const rooms = new Map();
export const leaderboards = new Map();
export const makeRoomCode = (length = 6) => Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

const securityHeaders = {
  'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains'
};
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };

function json(res, status, payload) {
  res.writeHead(status, { ...securityHeaders, 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' });
  res.end(JSON.stringify(payload));
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20_000) throw new Error('Body too large');
  }
  return raw ? JSON.parse(raw) : {};
}

function safePlayer(input) {
  if (!input || typeof input !== 'object' || typeof input.id !== 'string' || typeof input.name !== 'string') return null;
  const now = Date.now();
  return {
    id: input.id.slice(0, 80),
    name: input.name.trim().slice(0, 24) || 'Egg',
    eggStyle: Number.isFinite(input.eggStyle) ? Math.max(0, Math.min(20, Number(input.eggStyle))) : 0,
    ready: false,
    progress: 0,
    token: randomUUID(),
    joinedAt: now,
    lastSeenAt: now,
    actionWindowStartedAt: now,
    actionCount: 0,
  };
}

function publicPlayer(player, now = Date.now()) {
  return {
    id: player.id,
    name: player.name,
    eggStyle: player.eggStyle,
    ready: player.ready,
    progress: player.progress,
    connected: now - (player.lastSeenAt || 0) <= PRESENCE_TTL_MS,
  };
}

export function publicRoom(room) {
  const now = Date.now();
  return {
    code: room.code,
    gameSlug: room.gameSlug,
    status: room.status,
    winnerId: room.winnerId,
    revision: room.revision || 1,
    updatedAt: room.updatedAt,
    expiresAt: room.expiresAt,
    players: room.players.map(player => publicPlayer(player, now)),
  };
}

function codeOf(value) { return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); }
function routeParts(url) { return new URL(url, 'http://localhost').pathname.split('/').filter(Boolean); }
function nowIso() { return new Date().toISOString(); }

function roomRule(gameSlug) {
  const game = getGame(gameSlug);
  const maxMatch = game?.players?.match(/(\d+)\s*players/);
  const maxPlayers = maxMatch ? Math.max(2, Math.min(8, Number(maxMatch[1]))) : 8;
  const minPlayers = gameSlug === 'bad-egg' ? 4 : 2;
  return { step: 5, maxPlayers, minPlayers };
}

function touchRoom(room) {
  room.revision = (room.revision || 0) + 1;
  room.updatedAt = Date.now();
  room.expiresAt = room.updatedAt + ROOM_TTL_MS;
}

function serializeState() {
  return {
    version: 2,
    savedAt: Date.now(),
    rooms: [...rooms.values()],
    leaderboards: Object.fromEntries(leaderboards),
  };
}

let persistQueue = Promise.resolve();
export function persistState() {
  persistQueue = persistQueue.catch(() => {}).then(() => store.save(serializeState()));
  return persistQueue;
}

function pruneExpiredRooms() {
  const now = Date.now();
  let changed = false;
  for (const [code, room] of rooms) {
    if ((room.expiresAt || 0) <= now) {
      rooms.delete(code);
      changed = true;
    }
  }
  if (changed) void persistState();
}

async function restoreState() {
  const saved = await store.load({ version: 2, rooms: [], leaderboards: {} });
  const now = Date.now();
  for (const room of Array.isArray(saved.rooms) ? saved.rooms : []) {
    if (room?.code && room?.expiresAt > now && Array.isArray(room.players)) rooms.set(room.code, room);
  }
  for (const [key, entries] of Object.entries(saved.leaderboards || {})) {
    if (Array.isArray(entries)) leaderboards.set(key, entries.slice(0, 50));
  }
}

export const stateReady = restoreState();

function dailyChallenge(gameSlug, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const digest = createHash('sha256').update(`${day}:${gameSlug}:eggverse-rebuild`).digest('hex');
  const seed = digest.slice(0, 12);
  const target = 600 + (parseInt(digest.slice(0, 4), 16) % 601);
  const expires = new Date(`${day}T00:00:00.000Z`);
  expires.setUTCDate(expires.getUTCDate() + 1);
  return { id: `${day}:${gameSlug}`, gameSlug, seed, target, expiresAt: expires.toISOString() };
}

function leaderboardKey(gameSlug, challengeId = 'all') { return `${gameSlug}:${challengeId || 'all'}`; }
function publicLeaderboard(gameSlug, challengeId, limit = 10) {
  const entries = leaderboards.get(leaderboardKey(gameSlug, challengeId)) || [];
  return { gameSlug, challengeId, entries: entries.slice(0, Math.max(1, Math.min(25, limit))) };
}

function rateAction(player) {
  const now = Date.now();
  if (!player.actionWindowStartedAt || now - player.actionWindowStartedAt >= 1000) {
    player.actionWindowStartedAt = now;
    player.actionCount = 0;
  }
  player.actionCount = (player.actionCount || 0) + 1;
  return player.actionCount <= 40;
}

function authenticate(room, data) {
  const player = room.players.find(candidate => candidate.id === data.playerId && candidate.token === data.sessionToken);
  if (player) player.lastSeenAt = Date.now();
  return player;
}

export async function handler(req, res) {
  await stateReady;
  pruneExpiredRooms();
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, { ok:true, rooms:rooms.size, leaderboardBoards:leaderboards.size, persistence:true, now:nowIso() });
  }

  const challengeMatch = url.pathname.match(/^\/api\/challenges\/([a-z0-9-]+)$/);
  if (challengeMatch && req.method === 'GET') {
    const gameSlug = challengeMatch[1];
    if (!getGame(gameSlug)) return json(res, 404, { error:'Game not found.' });
    return json(res, 200, dailyChallenge(gameSlug));
  }

  const leaderboardMatch = url.pathname.match(/^\/api\/leaderboards\/([a-z0-9-]+)$/);
  if (leaderboardMatch) {
    const gameSlug = leaderboardMatch[1];
    if (!getGame(gameSlug)) return json(res, 404, { error:'Game not found.' });
    if (req.method === 'GET') {
      const challengeId = String(url.searchParams.get('challenge') || 'all').slice(0, 120);
      const limit = Number(url.searchParams.get('limit') || 10);
      return json(res, 200, publicLeaderboard(gameSlug, challengeId, limit));
    }
    if (req.method === 'POST') {
      try {
        const data = await body(req);
        const player = safePlayer(data.player);
        const score = Math.round(Number(data.score));
        const challengeId = String(data.challengeId || 'all').slice(0, 120);
        if (!player || !Number.isFinite(score) || score < 0 || score > SCORE_LIMIT) return json(res, 400, { error:'Invalid score submission.' });
        if (challengeId !== 'all' && challengeId !== dailyChallenge(gameSlug).id) return json(res, 409, { error:'Challenge is no longer active.' });
        const key = leaderboardKey(gameSlug, challengeId);
        const entries = leaderboards.get(key) || [];
        const existing = entries.find(entry => entry.playerId === player.id);
        const submitted = { playerId:player.id, name:player.name, eggStyle:player.eggStyle, score, recordedAt:Date.now() };
        if (!existing || score > existing.score) {
          const next = entries.filter(entry => entry.playerId !== player.id);
          next.push(submitted);
          next.sort((a, b) => b.score - a.score || a.recordedAt - b.recordedAt);
          leaderboards.set(key, next.slice(0, 50));
          await persistState();
        }
        return json(res, 200, publicLeaderboard(gameSlug, challengeId, 10));
      } catch {
        return json(res, 400, { error:'Invalid request.' });
      }
    }
  }

  if (url.pathname === '/api/rooms' && req.method === 'POST') {
    try {
      const data = await body(req);
      const player = safePlayer(data.player);
      const game = getGame(String(data.gameSlug || ''));
      if (!player || !game) return json(res, 400, { error:'Invalid player or game.' });
      let code = makeRoomCode();
      while (rooms.has(code)) code = makeRoomCode();
      const room = { code, gameSlug:game.slug, status:'lobby', players:[player], createdAt:Date.now(), revision:0 };
      touchRoom(room);
      rooms.set(code, room);
      await persistState();
      return json(res, 201, { ...publicRoom(room), sessionToken:player.token });
    } catch {
      return json(res, 400, { error:'Invalid request.' });
    }
  }

  const parts = routeParts(req.url);
  if (parts[0] === 'api' && parts[1] === 'rooms' && parts[2]) {
    const code = codeOf(parts[2]);
    const room = rooms.get(code);
    if (!room) return json(res, 404, { error:'Room not found.' });
    if (req.method === 'GET' && parts.length === 3) return json(res, 200, publicRoom(room));

    try {
      const data = await body(req);
      const action = parts[3];
      const rule = roomRule(room.gameSlug);

      if (action === 'join' && req.method === 'POST') {
        const player = safePlayer(data.player);
        if (!player) return json(res, 400, { error:'Invalid player.' });
        if (room.gameSlug !== data.gameSlug) return json(res, 409, { error:'That room belongs to a different game.' });
        if (room.status !== 'lobby') return json(res, 409, { error:'That room has already started.' });
        if (room.players.length >= rule.maxPlayers && !room.players.some(candidate => candidate.id === player.id)) return json(res, 409, { error:'That room is full.' });
        room.players = room.players.filter(candidate => candidate.id !== player.id);
        room.players.push(player);
        touchRoom(room);
        await persistState();
        return json(res, 200, { ...publicRoom(room), sessionToken:player.token });
      }

      if (action === 'reconnect' && req.method === 'POST') {
        const inputPlayer = data.player;
        const player = room.players.find(candidate => candidate.id === inputPlayer?.id && candidate.token === data.sessionToken);
        if (!player) return json(res, 403, { error:'Invalid room session.' });
        player.name = String(inputPlayer?.name || player.name).trim().slice(0, 24) || player.name;
        if (Number.isFinite(inputPlayer?.eggStyle)) player.eggStyle = Math.max(0, Math.min(20, Number(inputPlayer.eggStyle)));
        player.lastSeenAt = Date.now();
        touchRoom(room);
        await persistState();
        return json(res, 200, { ...publicRoom(room), sessionToken:player.token, reconnected:true });
      }

      const player = authenticate(room, data);
      if (!player) return json(res, 403, { error:'Invalid room session.' });

      if (action === 'heartbeat' && req.method === 'POST') {
        return json(res, 200, publicRoom(room));
      }

      if (action === 'ready' && req.method === 'POST') {
        player.ready = Boolean(data.ready);
        const readyPlayers = room.players.filter(candidate => candidate.ready);
        if (room.players.length >= rule.minPlayers && readyPlayers.length === room.players.length) {
          room.status = 'playing';
          room.startedAt = Date.now();
          room.winnerId = undefined;
          room.players.forEach(candidate => { candidate.progress = 0; candidate.actionCount = 0; candidate.actionWindowStartedAt = Date.now(); });
        }
        touchRoom(room);
        await persistState();
        return json(res, 200, publicRoom(room));
      }

      if (action === 'progress' && req.method === 'POST') {
        if (room.status !== 'playing') return json(res, 409, { error:'Room is not playing.' });
        if (!rateAction(player)) return json(res, 429, { error:'Too many room actions.' });
        player.progress = Math.min(100, player.progress + rule.step);
        if (player.progress >= 100 && room.status === 'playing') {
          room.status = 'finished';
          room.winnerId = player.id;
          room.finishedAt = Date.now();
        }
        touchRoom(room);
        await persistState();
        return json(res, 200, publicRoom(room));
      }

      if (action === 'reset' && req.method === 'POST') {
        room.status = 'lobby';
        room.winnerId = undefined;
        room.startedAt = undefined;
        room.finishedAt = undefined;
        room.players.forEach(candidate => { candidate.ready = false; candidate.progress = 0; });
        touchRoom(room);
        await persistState();
        return json(res, 200, publicRoom(room));
      }

      if (action === 'leave' && req.method === 'POST') {
        room.players = room.players.filter(candidate => candidate.id !== player.id);
        if (!room.players.length) rooms.delete(room.code);
        else {
          if (room.status !== 'lobby') room.status = 'lobby';
          room.winnerId = undefined;
          room.players.forEach(candidate => { candidate.ready = false; candidate.progress = 0; });
          touchRoom(room);
        }
        await persistState();
        return json(res, 200, room.players.length ? publicRoom(room) : { code:room.code, deleted:true });
      }

      return json(res, 404, { error:'Unknown room action.' });
    } catch {
      return json(res, 400, { error:'Invalid request.' });
    }
  }

  if (url.pathname.startsWith('/api/')) return json(res, 404, { error:'Not found.' });

  let requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  requested = normalize(requested).replace(/^\.\.(\/|\\|$)/, '');
  let file = join(root, requested);
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { ...securityHeaders, 'content-type':mime[extname(file)] || 'application/octet-stream', 'cache-control':extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600' });
    return res.end(data);
  } catch {}

  try {
    const data = await readFile(join(root, 'index.html'));
    res.writeHead(200, { ...securityHeaders, 'content-type':'text/html; charset=utf-8', 'cache-control':'no-cache' });
    res.end(data);
  } catch {
    json(res, 500, { error:'App unavailable.' });
  }
}

export const server = createServer(handler);
if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(PORT, () => console.log(`Eggverse rebuild listening on http://localhost:${PORT}`));
