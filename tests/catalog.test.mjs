import test from 'node:test';
import assert from 'node:assert/strict';
import { games, getGame } from '../public/catalog.js';

test('ships exactly 18 distinct catalog entries',()=>{assert.equal(games.length,18);assert.equal(new Set(games.map(g=>g.slug)).size,18)});
test('catalog contains multiplayer and solo-first games',()=>{assert.ok(games.some(g=>g.multiplayer));assert.ok(games.some(g=>!g.multiplayer))});
test('known game resolves by slug',()=>assert.equal(getGame('neon-nest').title,'Neon Nest'));
