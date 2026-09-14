# Architecture

## Runtime

Browser -> zero-dependency ES modules -> same-origin JSON APIs -> Node 22 HTTP server -> atomic JSON state file.

The production process serves the static client and application APIs from one origin. No npm runtime packages, database credentials, OAuth provider, or WebSocket infrastructure are required for the current single-instance release.

## Client boundaries

- `public/catalog.js`: data-driven 18-game catalog.
- `public/app.js`: SPA routing, profile/progression, six mini-game engine modes, room UX.
- `public/room-session.js`: fetch boundary that persists room session tokens in `sessionStorage`, retries joins as reconnects after reload, and sends presence heartbeats during room polling.
- `public/social.js`: daily-challenge and leaderboard surface; observes completed local runs and submits community scores.
- `public/styles.css` + `public/social.css`: responsive original UI and CSS-drawn egg avatars.

## Server boundaries

`server.mjs` provides static hosting, health checks, daily challenges, leaderboards, and authoritative room lifecycle APIs. Room progress ignores caller-supplied deltas and advances by server-owned rules. Authenticated room mutations require an opaque session token; public room payloads never return private tokens or rate-limit internals.

`lib/json-store.mjs` provides queued, temp-file + rename atomic persistence. The default state path is `.data/state.json` and can be overridden with `EGGVERSE_STATE_FILE`.

## State model

Guest profile/XP remains browser-local. Rooms and leaderboards persist on the application filesystem. Rooms expire after 24 hours. Presence is considered connected when an authenticated heartbeat/action has been seen within the current presence window.

This is durable for a **single instance with persistent disk**. It is not a horizontally consistent distributed store, and ephemeral/serverless filesystems should not be treated as durable.

## Trust model

Room race progress is authoritative because the server owns the increment, winner transition, action rate bound, and authenticated player session. Daily challenge scores are currently client submitted; they are useful for social comparison but are not anti-cheat certified.

## Scale path

Before multi-instance production, replace the JSON state adapter with Redis/Valkey, Durable Objects, Postgres, or another consistent shared state service. The HTTP API contract can remain stable. Polling can later move to WebSocket/SSE without changing the core room state machine.
