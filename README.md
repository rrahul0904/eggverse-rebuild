# Eggverse Rebuild

An independent, from-scratch functional rebuild of the social browser-arcade product pattern observed at `eggverse.co`. It focuses on instant-play mini-games, persistent egg identity, progression, and shareable multiplayer rooms.

> This repository does **not** contain or claim access to Eggverse's proprietary source code, commissioned art, music, game assets, or private APIs.

## Implemented now

- 18-game data-driven catalog
- 6 reusable playable game modes: tap, precision, memory, reflex, dodge, pop
- responsive home, game catalog, friends, rewards, profile, and game-detail flows
- guest identity stored locally with shell customization, XP and run count
- real room lifecycle over a same-origin JSON API: create, join, ready, synchronized race state, winner, rematch
- shareable six-character room codes and invite URLs
- CSP, HSTS, frame protection, MIME protection, permissions policy, bounded input handling
- `/api/health`
- Node built-in tests, integrity check, static build, CI, Docker
- **zero npm runtime dependencies and zero required third-party credentials**

## Run

Requires Node 22+.

```bash
node server.mjs
```

Open `http://localhost:3001`.

## Verify

```bash
npm test
npm run check
npm run build
```

## GitHub target

Create the public repository from this project directory:

```bash
gh repo create rrahul0904/eggverse-rebuild --public \
  --description "Independent functional rebuild of a social browser arcade: 18 games, egg identity, multiplayer rooms, progression, CI and Docker" \
  --source=. --remote=origin --push
```

## Docs

- `docs/REVERSE_ENGINEERING.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/OPERATIONS.md`
