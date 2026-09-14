# Operations

## Local and production-shaped runtime

No third-party packages or credentials are required.

```bash
node server.mjs
```

Open `http://localhost:3001`.

Health: `GET http://localhost:3001/api/health`

## Verification

```bash
npm test
npm run check
npm run build
```

## Container

```bash
docker build -t eggverse-rebuild .
docker run --rm -p 3001:3001 eggverse-rebuild
```

## Constraint

Run one app instance while rooms are in memory. Horizontal scaling is a deliberate Phase 2 concern, not a hidden deployment dependency.
