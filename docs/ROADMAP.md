# Roadmap

## Phase 1 — functional rebuild (implemented)
- 18-game arcade catalog
- responsive home/catalog/profile/rewards/friends flows
- six playable engine modes
- anonymous persistent egg identity
- room create/join/share/ready/tap-race/rematch loop
- health endpoint, CSP/HSTS/security headers, tests, CI, Docker
- zero external runtime dependencies

## Phase 2 — authoritative multiplayer adapters
- per-game match schemas and server-side simulation where cheating matters
- reconnect tokens, presence expiry, host migration, spectators
- WebSocket/SSE transport
- persistent/distributed room state

## Phase 3 — durable accounts/progression
- Postgres users, scores, achievements, cosmetics
- guest-to-account upgrade
- leaderboard seasons and private friend boards

## Phase 4 — retention/virality
- daily challenge seeds
- deep-link challenge cards
- ghost races and group tournaments
- installable PWA/offline shell

## Phase 5 — creator SDK
- signed game manifest format
- sandboxed game runtime boundary
- submission/review pipeline
- analytics and revenue controls
