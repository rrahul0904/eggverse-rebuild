import test from 'node:test';
import assert from 'node:assert/strict';
import { server, rooms, leaderboards } from '../server.mjs';

async function request(base, path, method='GET', data) {
  const response = await fetch(base + path, {
    method,
    headers: data ? {'content-type':'application/json'} : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

test('authoritative progress, reconnect, presence and daily leaderboard', async (t) => {
  rooms.clear();
  leaderboards.clear();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const created = await request(base, '/api/rooms', 'POST', {gameSlug:'neon-nest',player:{id:'p1',name:'Alpha',eggStyle:0}});
  const joined = await request(base, `/api/rooms/${created.body.code}/join`, 'POST', {gameSlug:'neon-nest',player:{id:'p2',name:'Beta',eggStyle:1}});
  await request(base, `/api/rooms/${created.body.code}/ready`, 'POST', {playerId:'p1',ready:true,sessionToken:created.body.sessionToken});
  await request(base, `/api/rooms/${created.body.code}/ready`, 'POST', {playerId:'p2',ready:true,sessionToken:joined.body.sessionToken});

  const authoritative = await request(base, `/api/rooms/${created.body.code}/progress`, 'POST', {playerId:'p1',delta:9999,sessionToken:created.body.sessionToken});
  assert.equal(authoritative.body.players.find(player => player.id === 'p1').progress, 5);

  const reconnected = await request(base, `/api/rooms/${created.body.code}/reconnect`, 'POST', {player:{id:'p1',name:'Alpha Reloaded',eggStyle:2},sessionToken:created.body.sessionToken});
  assert.equal(reconnected.status, 200);
  assert.equal(reconnected.body.reconnected, true);
  assert.equal(reconnected.body.players.find(player => player.id === 'p1').name, 'Alpha Reloaded');

  const heartbeat = await request(base, `/api/rooms/${created.body.code}/heartbeat`, 'POST', {playerId:'p1',sessionToken:created.body.sessionToken});
  assert.equal(heartbeat.body.players.find(player => player.id === 'p1').connected, true);

  const challenge = await request(base, '/api/challenges/neon-nest');
  assert.equal(challenge.status, 200);
  assert.match(challenge.body.id, /^\d{4}-\d{2}-\d{2}:neon-nest$/);

  await request(base, '/api/leaderboards/neon-nest', 'POST', {challengeId:challenge.body.id,score:700,player:{id:'p1',name:'Alpha',eggStyle:0}});
  await request(base, '/api/leaderboards/neon-nest', 'POST', {challengeId:challenge.body.id,score:900,player:{id:'p2',name:'Beta',eggStyle:1}});
  const improved = await request(base, '/api/leaderboards/neon-nest', 'POST', {challengeId:challenge.body.id,score:1000,player:{id:'p1',name:'Alpha',eggStyle:0}});
  assert.deepEqual(improved.body.entries.map(entry => [entry.playerId, entry.score]), [['p1',1000],['p2',900]]);

  const stale = await request(base, '/api/leaderboards/neon-nest', 'POST', {challengeId:'2000-01-01:neon-nest',score:10,player:{id:'p3',name:'Old',eggStyle:0}});
  assert.equal(stale.status, 409);
});
