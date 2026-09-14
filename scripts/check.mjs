import { access, readFile } from 'node:fs/promises';
const required=['public/index.html','public/app.js','public/styles.css','public/catalog.js','server.mjs','README.md','docs/ARCHITECTURE.md','.github/workflows/ci.yml'];
for(const file of required) await access(file);
const app=await readFile('public/app.js','utf8');
if(!app.includes('mountRoom')||!app.includes('mountArcade'))throw new Error('Expected multiplayer and arcade runtime entry points.');
console.log(`Static integrity check passed (${required.length} required files).`);
