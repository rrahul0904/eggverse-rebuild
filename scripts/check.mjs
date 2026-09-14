import { access, readFile } from 'node:fs/promises';
const required = [
  'public/index.html','public/app.js','public/styles.css','public/catalog.js','public/room-session.js','public/social.js','public/social.css',
  'server.mjs','lib/json-store.mjs','README.md','docs/ARCHITECTURE.md','.github/workflows/ci.yml'
];
for (const file of required) await access(file);
const app = await readFile('public/app.js','utf8');
const server = await readFile('server.mjs','utf8');
const index = await readFile('public/index.html','utf8');
if (!app.includes('mountRoom') || !app.includes('mountArcade')) throw new Error('Expected multiplayer and arcade runtime entry points.');
if (!server.includes("action === 'reconnect'") || !server.includes('leaderboardMatch')) throw new Error('Expected Phase 2 reconnect and leaderboard runtime.');
if (!index.includes('/room-session.js') || !index.includes('/social.js')) throw new Error('Expected social runtime scripts in app shell.');
console.log(`Static integrity check passed (${required.length} required files).`);
