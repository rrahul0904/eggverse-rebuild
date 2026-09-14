import { games, getGame } from './catalog.js';

const app = document.querySelector('#app');
const PROFILE_KEY = 'eggverse-rebuild-profile-v2';
let cleanupCurrent = () => {};
let roomPoll = null;
let activeRoom = null;
let roomSessionToken = null;

const palettes = [
  ['#fff7dc','#ffb84d'],['#dff7ff','#6dcff6'],['#ffe2ed','#ff6f91'],
  ['#e8e2ff','#9d7cff'],['#e5ffd9','#77d353'],['#fff0d6','#f28f3b']
];

function id() { return crypto.randomUUID?.() || Math.random().toString(36).slice(2); }
function loadProfile() {
  try { const raw = localStorage.getItem(PROFILE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return { id:id(), name:`Egg ${Math.floor(100+Math.random()*900)}`, eggStyle:0, xp:0, wins:0, gamesPlayed:0 };
}
let profile = loadProfile();
function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {} }
function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function egg(style=0,size='md',animated=false) {
  const [shell,accent]=palettes[Math.abs(style)%palettes.length];
  return `<div class="egg-avatar egg-${size}${animated?' egg-bob':''}" style="--egg-shell:${shell};--egg-accent:${accent}" aria-label="Egg avatar"><div class="egg-face"><span class="eye"></span><span class="eye"></span><span class="egg-mouth"></span></div><div class="egg-mark"></div></div>`;
}
function nav() {
  return `<nav class="bottom-nav" aria-label="Primary navigation">
    ${[['/','⌂','Home'],['/games','▦','Play'],['/friends','♟','Friends'],['/rewards','★','Rewards'],['/you','●','You']].map(([to,icon,label])=>`<a data-link href="${to}" class="nav-item${location.pathname===to?' active':''}"><b>${icon}</b><span>${label}</span></a>`).join('')}
  </nav>`;
}
function gameCard(g) {
  return `<a data-link class="game-card" href="/games/${g.slug}" style="--accent:${g.accent}"><div class="game-art"><span>${g.emoji}</span></div><div class="game-card-body"><span class="eyebrow">${g.genre}</span><h3>${g.title}</h3><p>${g.tagline}</p><small>${g.players}</small></div></a>`;
}
function shell(content, showNav=true) { return `<div class="app-shell">${content}${showNav?nav():''}</div>`; }

function home() {
  return shell(`<main><header class="site-header"><a data-link href="/" class="brand"><span>egg</span>verse <i>rebuild</i></a><a data-link href="/you" class="mini-profile">${egg(profile.eggStyle,'sm')}<span>${escapeHtml(profile.name)}</span></a></header>
    <section class="hero"><div class="hero-copy"><span class="pill">18 tiny worlds · zero downloads</span><h1>Small eggs.<br><em>Big escapes.</em></h1><p>Race, dodge, remember, pop and challenge your friends from one pocket-sized browser arcade.</p><div class="hero-actions"><a data-link class="primary-button" href="/games">Let’s play</a><a class="text-button" href="#featured">Explore minigames →</a></div></div><div class="hero-art"><div class="portal">${egg(profile.eggStyle,'lg',true)}</div><div class="orbit orbit-a">🏎️</div><div class="orbit orbit-b">☁️</div><div class="orbit orbit-c">⚡</div></div></section>
    <section id="featured" class="section-wrap"><div class="section-heading"><div><span class="eyebrow">Pick your kind of chaos</span><h2>Your next five-minute obsession.</h2></div><a data-link href="/games">Browse all 18 →</a></div><div class="game-grid">${games.slice(0,6).map(gameCard).join('')}</div></section>
    <section class="friend-banner"><div><span class="eyebrow">Friendly enemies</span><h2>Pick a game. Share the code. Settle it.</h2><p>Multiplayer rooms are built into supported games. No account wall required.</p></div><a data-link href="/games/neon-nest" class="primary-button">Start a room</a></section>
    <section class="identity-banner"><div class="egg-row">${[0,1,2,3,4].map(n=>egg(n,'md')).join('')}</div><div><span class="eyebrow">Your egg. Your name.</span><h2>One identity across every game.</h2><p>Your local profile keeps XP, wins and style consistent across the arcade.</p></div><a data-link href="/you" class="text-button">Make it yours →</a></section>
  </main>`);
}
function catalog() {
  return shell(`<main class="page"><header class="page-header"><div><span class="eyebrow">Pocket arcade</span><h1>Pick your chaos.</h1></div><label class="search-box">⌕ <input id="game-search" placeholder="Search 18 games"></label></header><div id="game-grid" class="game-grid">${games.map(gameCard).join('')}</div></main>`);
}
function friends() { return shell(`<main class="page narrow"><span class="eyebrow">Crew</span><h1>Friendly enemies.</h1><div class="empty-card"><div class="big-icon">♟</div><h2>Invite by room code</h2><p>${escapeHtml(profile.name)}, open any multiplayer game, create a room, and share the six-character code or invite URL. No signup wall.</p><a data-link class="primary-button" href="/games/neon-nest">Create a room</a></div></main>`); }
function rewards() {
  const level=Math.floor(profile.xp/500)+1, pct=(profile.xp%500)/5;
  return shell(`<main class="page narrow"><span class="eyebrow">Rewards</span><h1>Crack level ${level}.</h1><div class="reward-card"><div class="big-icon">★</div><strong>${profile.xp} XP</strong><p>Play runs to earn XP. Every 500 XP unlocks the next shell tier.</p><div class="xp-track"><span style="width:${pct}%"></span></div><div class="egg-row">${[0,1,2,3,4,5].map(n=>`<div class="${n<level?'':'locked'}">${egg(n,'sm')}</div>`).join('')}</div></div></main>`);
}
function you() {
  return shell(`<main class="page narrow"><span class="eyebrow">You</span><h1>Your little universe.</h1><div class="profile-card">${egg(profile.eggStyle,'lg',true)}<label>Egg name<input id="profile-name" maxlength="20" value="${escapeHtml(profile.name)}"></label><div><span class="eyebrow">Choose a shell</span><div class="style-picker">${[0,1,2,3,4,5].map(n=>`<button data-style="${n}" class="${profile.eggStyle===n?'selected':''}">${egg(n,'sm')}</button>`).join('')}</div></div><button id="save-profile" class="primary-button">Save profile</button><div class="stats"><span><strong>${profile.gamesPlayed}</strong>runs</span><span><strong>${profile.wins}</strong>wins</span><span><strong>${profile.xp}</strong>XP</span></div></div></main>`);
}
function notFound() { return shell(`<main class="page narrow"><div class="big-icon">✦</div><h1>This egg rolled away.</h1><p>That page does not exist.</p><a data-link class="primary-button" href="/">Back home</a></main>`); }

function gameDetail(game) {
  return shell(`<main class="game-page" style="--detail-accent:${game.accent}"><header class="game-detail-header"><a data-link href="/games" class="icon-button">←</a><div class="game-title"><span>${game.emoji}</span><div><small>${game.genre}</small><h1>${game.title}</h1></div></div><span class="game-mode">${game.players}</span></header><div class="game-layout"><div><p class="game-tagline">${game.tagline}</p><section id="arcade" class="arcade-shell" style="--game-accent:${game.accent}"></section><div class="game-notes"><div><strong>How to play</strong><p>Each title maps to one of six original arcade engine modes optimized for mouse and touch.</p></div><div><strong>Independent rebuild</strong><p>Product patterns are reproduced from scratch without copying proprietary source or commissioned assets.</p></div></div></div><aside id="room-panel" class="room-panel"></aside></div></main>`,false);
}

function render() {
  cleanupCurrent(); cleanupCurrent=()=>{};
  if (roomPoll) { clearInterval(roomPoll); roomPoll=null; }
  const path=location.pathname;
  if (path==='/') app.innerHTML=home();
  else if (path==='/games') app.innerHTML=catalog();
  else if (path==='/friends') app.innerHTML=friends();
  else if (path==='/rewards') app.innerHTML=rewards();
  else if (path==='/you') app.innerHTML=you();
  else if (path.startsWith('/games/')) { const game=getGame(path.split('/')[2]); app.innerHTML=game?gameDetail(game):notFound(); if (game) mountGame(game); }
  else app.innerHTML=notFound();
  bindCommon();
}

function bindCommon() {
  document.querySelectorAll('[data-link]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();navigate(link.getAttribute('href'));}));
  const search=document.querySelector('#game-search');
  search?.addEventListener('input',()=>{ const q=search.value.toLowerCase(); document.querySelector('#game-grid').innerHTML=games.filter(g=>`${g.title} ${g.genre}`.toLowerCase().includes(q)).map(gameCard).join(''); bindCommon(); });
  document.querySelectorAll('[data-style]').forEach(button=>button.addEventListener('click',()=>{profile.eggStyle=Number(button.dataset.style);saveProfile();render();}));
  document.querySelector('#save-profile')?.addEventListener('click',()=>{ const name=document.querySelector('#profile-name').value.trim(); if(name) profile.name=name.slice(0,20); saveProfile(); render(); });
}
function navigate(path) { history.pushState({},'',path); render(); window.scrollTo(0,0); }
window.addEventListener('popstate',render);

function mountGame(game) {
  mountArcade(game);
  mountRoom(game);
}
function finishRun(score) { profile.xp += Math.max(10,Math.round(score/10)); profile.gamesPlayed += 1; saveProfile(); }
function mountArcade(game) {
  const root=document.querySelector('#arcade'); let status='idle',score=0,time=15,timer=null,raf=null;
  const state={ marker:0,dir:1,target:{x:50,y:50},sequence:[],memory:[],readyAt:0,reflex:false };
  const stop=()=>{if(timer)clearInterval(timer);if(raf)cancelAnimationFrame(raf);timer=raf=null}; cleanupCurrent=stop;
  function frame(message='Press start when your egg is ready.') {
    root.innerHTML=`<div class="arcade-topline"><strong>${game.title}</strong><span>${status==='playing'&&!['reflex','memory'].includes(game.engine)?`${time}s`:`${score} pts`}</span></div><div id="stage" class="arcade-stage"></div><div id="arcade-message" class="arcade-message">${message}</div>${status==='done'?'<button id="replay" class="primary-button">Play again</button>':''}`;
    const stage=root.querySelector('#stage');
    if(status==='idle') stage.innerHTML='<button id="start-run" class="big-play">▶ Start run</button>';
    else drawStage(stage);
    root.querySelector('#start-run')?.addEventListener('click',start);
    root.querySelector('#replay')?.addEventListener('click',start);
  }
  function drawStage(stage) {
    if(game.engine==='tap'){stage.innerHTML=`<button id="tap" class="tap-target">TAP<br><small>${score}/50</small></button>`;stage.querySelector('#tap').onpointerdown=()=>{if(status!=='playing')return;score++;if(score>=50)finish(1000+time*20);else frame('Keep going!');};}
    if(game.engine==='precision'){stage.innerHTML=`<div class="precision-wrap"><div class="precision-track"><div class="precision-zone"></div><div id="marker" class="precision-marker" style="left:${state.marker}%"></div></div><button id="lock">Lock it</button></div>`;stage.querySelector('#lock').onclick=()=>{const pts=Math.max(0,Math.round(100-Math.abs(50-state.marker)*2));score+=pts;frame(`+${pts} precision points`);};}
    if(game.engine==='memory'){stage.innerHTML=`<div class="memory-pad">${[0,1,2,3].map(n=>`<button data-memory="${n}">${n+1}</button>`).join('')}</div>`;stage.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>memoryPress(Number(b.dataset.memory)));}
    if(game.engine==='reflex'){stage.innerHTML=`<button id="reflex" class="reflex-button${state.reflex?' ready':''}">${state.reflex?'CLICK!':'WAIT'}</button>`;stage.querySelector('#reflex').onclick=reflexPress;}
    if(game.engine==='dodge'){stage.innerHTML=`<button id="moving" class="moving-target" style="left:${state.target.x}%;top:${state.target.y}%">🥚</button>`;stage.querySelector('#moving').onclick=()=>{score+=100;randomTarget();frame('Nice catch. Again!');};}
    if(game.engine==='pop'){stage.innerHTML=`<div class="bubble-grid">${Array.from({length:16},(_,i)=>`<button data-bubble>${['🟣','🟡','🟢','🔵'][i%4]}</button>`).join('')}</div>`;stage.querySelectorAll('[data-bubble]').forEach(b=>b.onclick=()=>{score+=25;b.textContent='✨';b.disabled=true;});}
  }
  function start(){stop();status='playing';score=0;time=15;state.memory=[];state.reflex=false;state.marker=0;state.dir=1;randomTarget();
    if(game.engine==='memory'){state.sequence=Array.from({length:5},()=>Math.floor(Math.random()*4));frame(`Memorize: ${state.sequence.map(n=>n+1).join(' · ')}`);setTimeout(()=>{if(status==='playing')frame('Repeat the sequence.')},2200);return;}
    if(game.engine==='reflex'){state.readyAt=Date.now()+1200+Math.random()*2600;frame('Wait for green…');setTimeout(()=>{if(status==='playing'){state.reflex=true;frame('NOW!');}},state.readyAt-Date.now());return;}
    frame('Go!'); timer=setInterval(()=>{time--;if(time<=0)finish(score);else frame('Go!');},1000);
    if(game.engine==='precision')animateMarker();
  }
  function animateMarker(){if(status!=='playing')return;state.marker+=state.dir*1.4;if(state.marker>=100||state.marker<=0)state.dir*=-1;const marker=document.querySelector('#marker');if(marker)marker.style.left=`${state.marker}%`;raf=requestAnimationFrame(animateMarker);}
  function memoryPress(n){if(status!=='playing'||document.querySelector('#arcade-message').textContent.startsWith('Memorize'))return;state.memory.push(n);const i=state.memory.length-1;if(state.sequence[i]!==n)return finish(Math.max(0,i)*200);if(state.memory.length===state.sequence.length)finish(1000);}
  function reflexPress(){if(status!=='playing')return;if(!state.reflex){state.readyAt=Date.now()+1000+Math.random()*1600;frame('Too soon! Wait…');setTimeout(()=>{if(status==='playing'){state.reflex=true;frame('NOW!');}},state.readyAt-Date.now());return;}finish(Math.max(50,1000-(Date.now()-state.readyAt)));}
  function randomTarget(){state.target={x:12+Math.random()*76,y:18+Math.random()*64};}
  function finish(final){stop();status='done';score=final;finishRun(score);frame(`Run complete — ${score} points.`);}
  frame();
}

async function api(path, options={}) {
  const response=await fetch(path,{headers:{'content-type':'application/json'},...options});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body.error||'Request failed');
  return body;
}
function mountRoom(game) {
  const panel=document.querySelector('#room-panel'); const params=new URLSearchParams(location.search); const invited=params.get('room');
  activeRoom=null; roomSessionToken=null;
  async function renderRoom() {
    if(!activeRoom){panel.innerHTML=`<div><span class="eyebrow">Live room</span><h3>Bring your crew</h3><p>Create a room or join with a six-character code.</p></div><div class="room-actions"><button id="create-room" class="primary-button">Create room</button><div class="join-row"><input id="join-code" maxlength="6" value="${escapeHtml(invited||'')}" placeholder="ROOM42"><button id="join-room">Join</button></div></div><p id="room-error" class="error-text"></p>`;panel.querySelector('#create-room').onclick=create;panel.querySelector('#join-room').onclick=join;return;}
    const room=activeRoom, me=room.players.find(p=>p.id===profile.id);
    panel.innerHTML=`<div class="room-code-row"><div><span class="eyebrow">Room code</span><strong>${room.code}</strong></div><button id="copy-room">Copy invite</button></div><div class="player-list">${room.players.map(p=>`<div class="player-pill"><span>${p.ready?'🟢':'⚪'} ${escapeHtml(p.name)}</span><small>${p.progress}%</small></div>`).join('')}</div>${room.status==='lobby'?`<button id="ready-room" class="primary-button full">${me?.ready?'Not ready':'Ready up'}</button>`:''}${room.status==='playing'?'<div class="room-race"><p>Tap race: first egg to 100 wins.</p><button id="race-tap" class="tap-target small">TAP</button></div>':''}${room.status==='finished'?`<p>${room.winnerId===profile.id?'🏆 You won the room!':'Another egg got there first.'}</p><button id="reset-room">Rematch</button>`:''}`;
    panel.querySelector('#copy-room')?.addEventListener('click',()=>navigator.clipboard?.writeText(`${location.origin}/games/${game.slug}?room=${room.code}`));
    panel.querySelector('#ready-room')?.addEventListener('click',()=>mutate(`/api/rooms/${room.code}/ready`,{playerId:profile.id,ready:!me?.ready}));
    panel.querySelector('#race-tap')?.addEventListener('pointerdown',()=>mutate(`/api/rooms/${room.code}/progress`,{playerId:profile.id,delta:4}));
    panel.querySelector('#reset-room')?.addEventListener('click',()=>mutate(`/api/rooms/${room.code}/reset`,{playerId:profile.id}));
  }
  async function create(){try{activeRoom=await api('/api/rooms',{method:'POST',body:JSON.stringify({gameSlug:game.slug,player:identity()})});roomSessionToken=activeRoom.sessionToken;startPoll();renderRoom();}catch(e){showError(e.message)}}
  async function join(){try{const code=panel.querySelector('#join-code').value.trim().toUpperCase();activeRoom=await api(`/api/rooms/${code}/join`,{method:'POST',body:JSON.stringify({gameSlug:game.slug,player:identity()})});roomSessionToken=activeRoom.sessionToken;startPoll();renderRoom();}catch(e){showError(e.message)}}
  async function mutate(path,body){try{activeRoom=await api(path,{method:'POST',body:JSON.stringify({...body,sessionToken:roomSessionToken})});renderRoom();}catch(e){showError(e.message)}}
  function identity(){return{id:profile.id,name:profile.name,eggStyle:profile.eggStyle}}
  function showError(message){const el=panel.querySelector('#room-error');if(el)el.textContent=message;else alert(message)}
  function startPoll(){if(roomPoll)clearInterval(roomPoll);roomPoll=setInterval(async()=>{if(!activeRoom)return;try{const next=await api(`/api/rooms/${activeRoom.code}`);activeRoom={...next,sessionToken:roomSessionToken};renderRoom();}catch{}},700)}
  renderRoom();
}

render();
