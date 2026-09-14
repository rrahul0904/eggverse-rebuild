import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const PORT = Number(process.env.PORT || 3001);
export const rooms = new Map();
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const makeRoomCode = (length=6) => Array.from({length},()=>ALPHABET[Math.floor(Math.random()*ALPHABET.length)]).join('');
export const publicRoom = room => ({code:room.code,gameSlug:room.gameSlug,status:room.status,winnerId:room.winnerId,players:room.players.map(({token,...p})=>p)});

const securityHeaders = {
  'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains'
};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
function json(res,status,body){res.writeHead(status,{...securityHeaders,'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(body));}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>20000)throw new Error('Body too large');}return raw?JSON.parse(raw):{};}
function safePlayer(input){if(!input||typeof input!=='object'||typeof input.id!=='string'||typeof input.name!=='string')return null;return{id:input.id.slice(0,80),name:input.name.slice(0,24),eggStyle:Number.isFinite(input.eggStyle)?Math.max(0,Math.min(20,Number(input.eggStyle))):0,ready:false,progress:0,token:randomUUID()};}
function codeOf(value){return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)}
function routeParts(url){return new URL(url,'http://localhost').pathname.split('/').filter(Boolean)}

export async function handler(req,res){
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/health'&&req.method==='GET')return json(res,200,{ok:true,rooms:rooms.size,now:new Date().toISOString()});
  if(url.pathname==='/api/rooms'&&req.method==='POST'){
    try{const data=await body(req),player=safePlayer(data.player);if(!player||typeof data.gameSlug!=='string')return json(res,400,{error:'Invalid player or game.'});let code=makeRoomCode();while(rooms.has(code))code=makeRoomCode();const room={code,gameSlug:data.gameSlug.slice(0,80),status:'lobby',players:[player],createdAt:Date.now()};rooms.set(code,room);return json(res,201,{...publicRoom(room),sessionToken:player.token});}catch{return json(res,400,{error:'Invalid request.'})}
  }
  const parts=routeParts(req.url);
  if(parts[0]==='api'&&parts[1]==='rooms'&&parts[2]){
    const code=codeOf(parts[2]),room=rooms.get(code);if(!room)return json(res,404,{error:'Room not found.'});
    if(req.method==='GET'&&parts.length===3)return json(res,200,publicRoom(room));
    try{const data=await body(req),action=parts[3];
      if(action==='join'&&req.method==='POST'){const player=safePlayer(data.player);if(!player)return json(res,400,{error:'Invalid player.'});if(room.gameSlug!==data.gameSlug)return json(res,409,{error:'That room belongs to a different game.'});if(room.status!=='lobby')return json(res,409,{error:'That room has already started.'});if(room.players.length>=8)return json(res,409,{error:'That room is full.'});room.players=room.players.filter(p=>p.id!==player.id);room.players.push(player);return json(res,200,{...publicRoom(room),sessionToken:player.token});}
      const player=room.players.find(p=>p.id===data.playerId&&p.token===data.sessionToken);if(!player)return json(res,403,{error:'Invalid room session.'});
      if(action==='ready'&&req.method==='POST'){player.ready=Boolean(data.ready);if(room.players.length>=1&&room.players.every(p=>p.ready)){room.status='playing';room.players.forEach(p=>p.progress=0)}return json(res,200,publicRoom(room));}
      if(action==='progress'&&req.method==='POST'){if(room.status!=='playing')return json(res,409,{error:'Room is not playing.'});const delta=Math.max(0,Math.min(5,Number(data.delta)||0));player.progress=Math.min(100,player.progress+delta);if(player.progress>=100){room.status='finished';room.winnerId=player.id;}return json(res,200,publicRoom(room));}
      if(action==='reset'&&req.method==='POST'){room.status='lobby';room.winnerId=undefined;room.players.forEach(p=>{p.ready=false;p.progress=0});return json(res,200,publicRoom(room));}
      return json(res,404,{error:'Unknown room action.'});
    }catch{return json(res,400,{error:'Invalid request.'})}
  }
  if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Not found.'});
  let requested=url.pathname==='/'?'index.html':url.pathname.slice(1);requested=normalize(requested).replace(/^\.\.(\/|\\|$)/,'');let file=join(root,requested);
  try{const info=await stat(file);if(info.isDirectory())file=join(file,'index.html');const data=await readFile(file);res.writeHead(200,{...securityHeaders,'content-type':mime[extname(file)]||'application/octet-stream','cache-control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});return res.end(data);}catch{}
  try{const data=await readFile(join(root,'index.html'));res.writeHead(200,{...securityHeaders,'content-type':'text/html; charset=utf-8','cache-control':'no-cache'});res.end(data);}catch{json(res,500,{error:'App unavailable.'})}
}

export const server=createServer(handler);
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(PORT,()=>console.log(`Eggverse rebuild listening on http://localhost:${PORT}`));
