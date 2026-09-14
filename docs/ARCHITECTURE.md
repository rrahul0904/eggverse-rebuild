# Architecture

## Runtime

Browser -> zero-dependency ES modules -> same-origin JSON room API -> Node 22 HTTP server.

The production process serves the static client and the multiplayer room API from one origin. This removes CORS, package-registry, database, auth, and WebSocket infrastructure blockers from Phase 1.

## Client boundaries

- `public/catalog.js`: data-driven 18-game catalog.
- `public/app.js`: SPA routing, profile/progression, six mini-game engine modes, room UX.
- `public/styles.css`: responsive original UI and CSS-drawn egg avatars.

## Server boundaries

`server.mjs` provides static hosting, health checks, room creation/join/ready/progress/rematch APIs, input bounds, room limits, and production security headers including CSP and HSTS.

## Phase 1 state model

Guest identity and XP live in browser `localStorage`. Multiplayer rooms are in memory and support up to eight players. Clients poll room state at 700ms intervals; the server bounds progress deltas and determines the winner.

## Scale path

Phase 1 intentionally targets a single application instance. Before horizontal scaling, move room state to Redis/Valkey, Durable Objects, or an equivalent authoritative state service; then replace polling with WebSocket/SSE transport if lower latency is required.
