# Operations

## Local

```bash
node server.mjs
```

The service listens on `PORT` (default `3001`). Health is available at `/api/health`.

## Persistent state

The default state file is `.data/state.json`. Set `EGGVERSE_STATE_FILE=/path/to/state.json` to place state elsewhere. The file contains private room session tokens, so it must never be committed or baked into an image.

## Docker

```bash
docker build -t eggverse-rebuild .
docker run --rm -p 3001:3001 -v eggverse-data:/app/.data eggverse-rebuild
```

The image declares `/app/.data` as a volume. Without a persistent volume, rooms and leaderboards can disappear with the container filesystem.

## Verification

```bash
npm test
npm run check
npm run build
docker build -t eggverse-rebuild .
```

## Production constraints

A single app instance with persistent disk is supported by the current state adapter. Do not claim horizontally scaled durability until the state adapter is moved to shared infrastructure. Community leaderboards are client submitted; room race results have stronger server-side integrity guarantees.
