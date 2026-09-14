import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonStateStore } from '../lib/json-store.mjs';

test('json state store writes atomically and reloads state', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'eggverse-store-'));
  t.after(() => rm(dir, {recursive:true,force:true}));
  const file = join(dir, 'state.json');
  const store = new JsonStateStore(file);
  await store.save({version:2,rooms:[{code:'ABC234'}]});
  assert.deepEqual(await store.load(), {version:2,rooms:[{code:'ABC234'}]});
  assert.match(await readFile(file, 'utf8'), /ABC234/);
});
