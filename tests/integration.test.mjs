import test from 'node:test';
import assert from 'node:assert/strict';
import { server, rooms } from '../server.mjs';

async function request(base, path, method='GET', data) {
  const response = await fetch(base + path, {
    method,
    headers: data ? {'content-type':'application/json'} : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

test('health and authenticated two-player room lifecycle', async (t) => {
  rooms.clear();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const health = await request(base, '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  const created = await request(base, '/api/rooms', 'POST', {gameSlug:'neon-nest',player:{id:'p1',name:'Alpha',eggStyle:0}});
  assert.equal(created.status, 201);
  assert.match(created.body.code, /^[A-Z2-9]{6}$/);
  assert.ok(created.body.sessionToken);

  const joined = await request(base, `/api/rooms/${created.body.code}/join`, 'POST', {gameSlug:'neon-nest',player:{id:'p2',name:'Beta',eggStyle:1}});
  assert.equal(joined.status, 200);
  assert.equal(joined.body.players.length, 2);

  const denied = await request(base, `/api/rooms/${created.body.code}/ready`, 'POST', {playerId:'p1',ready:true,sessionToken:'wrong'});
  assert.equal(denied.status, 403);

  await request(base, `/api/rooms/${created.body.code}/ready`, 'POST', {playerId:'p1',ready:true,sessionToken:created.body.sessionToken});
  const started = await request(base, `/api/rooms/${created.body.code}/ready`, 'POST', {playerId:'p2',ready:true,sessionToken:joined.body.sessionToken});
  assert.equal(started.body.status, 'playing');

  let state;
  for (let i=0;i<20;i++) {
    state = await request(base, `/api/rooms/${created.body.code}/progress`, 'POST', {playerId:'p1',delta:5,sessionToken:created.body.sessionToken});
  }
  assert.equal(state.body.status, 'finished');
  assert.equal(state.body.winnerId, 'p1');

  const publicState = await request(base, `/api/rooms/${created.body.code}`);
  assert.equal('sessionToken' in publicState.body, false);
  assert.equal(JSON.stringify(publicState.body).includes(created.body.sessionToken), false);
});
