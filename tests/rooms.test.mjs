import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRoomCode, publicRoom } from '../server.mjs';

test('room code is six shareable characters',()=>assert.match(makeRoomCode(),/^[A-Z2-9]{6}$/));
test('public room omits private token fields',()=>{const room={code:'ABC234',gameSlug:'neon-nest',status:'lobby',players:[{id:'p1',name:'Egg',eggStyle:0,ready:false,progress:0,token:'secret'}]};assert.equal(JSON.stringify(publicRoom(room)).includes('secret'),false)});
