# Roadmap

## Complete

### Phase 1 — playable social arcade shell
- 18-game catalog and six reusable arcade engines
- profile, XP, rewards and responsive shell
- room codes, authenticated mutations, race winner state
- security headers, Docker, CI and local certification

### Phase 2 — resilient social runtime
- server-owned room progress increments and rate bounds
- reconnect after reload with session-scoped credentials
- player presence heartbeats and room expiry
- atomic single-instance room/leaderboard persistence
- deterministic daily challenges
- per-game best-score boards and shareable challenge URLs
- explicit trust boundary between authoritative room races and community scoreboards

## Next

### Phase 3 — distributed realtime
- shared Redis/Valkey/Durable Object/Postgres state adapter
- WebSocket or SSE room subscriptions instead of polling
- reconnect leases across instances
- idempotency keys and stronger abuse/rate controls
- deployment preview and multi-browser acceptance matrix

### Phase 4 — durable identity and competitive integrity
- optional account upgrade from guest identity
- signed/verified run submissions for competitive leaderboards
- friends and private group leaderboards
- challenge history, seasons and moderation controls
