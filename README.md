# Eggverse Rebuild

An independent, from-scratch functional rebuild of the social browser-arcade product pattern observed at `eggverse.co`. It focuses on instant-play mini-games, persistent egg identity, shareable multiplayer rooms, daily challenges, and lightweight progression.

> This repository does **not** contain or claim access to Eggverse's proprietary source code, commissioned art, music, game assets, or private APIs.

## Implemented now

- 18-game data-driven catalog
- 6 reusable playable game modes: tap, precision, memory, reflex, dodge, pop
- responsive home, game catalog, friends, rewards, profile, and game-detail flows
- guest identity stored locally with shell customization, XP and run count
- server-authoritative room race progress; client-provided progress deltas are ignored
- room create/join/ready/race/winner/rematch/leave APIs
- reload-safe room reconnect using session-scoped tokens and presence heartbeats
- single-instance persistent room snapshots and challenge scoreboards via atomic JSON state
- deterministic daily challenges and per-game best-score leaderboards
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

State defaults to `.data/state.json`. Override it with `EGGVERSE_STATE_FILE` or mount `/app/.data` when using Docker.

## Verify

```bash
npm test
npm run check
npm run build
```

## Trust boundaries

Multiplayer room race progress is server-authoritative and rate bounded. Daily leaderboard scores are currently community/client submitted and should not be treated as anti-cheat certified competitive rankings.

## Docs

- `docs/REVERSE_ENGINEERING.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/OPERATIONS.md`
