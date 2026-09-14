# Eggverse product reverse engineering

This repository is an **independent implementation** of publicly observable product patterns from `eggverse.co`. It does not contain Eggverse source code, extracted proprietary assets, copied game logic, or commissioned artwork.

## Publicly observable product surface

As of 2026-09-14, the public home page presents a browser arcade with 18 games, zero-download positioning, persistent egg identity, friend-oriented room-code play, rewards, and profile areas. Prominent titles include Neon Nest, Cloud Hopper, Bad Egg, Egg on the Run, Frost Hop, and Egg Pop.

## Product thesis

The strongest reusable loop is:

`discover -> choose identity -> instant play -> create room -> share code/link -> rematch -> earn progression -> try another game`

The rebuild therefore prioritizes the **arcade shell and social room primitive** over exact game-by-game visual parity.

## Architecture inferred vs implemented

Historical public writing about Eggverse's predecessor Anbu mentions React, Redux, Chakra UI, WebSockets, AWS and Stripe. Those details describe the older product and are not treated as proof of the current production stack.

The final Phase 1 rebuild deliberately uses a smaller stack:
- browser-native ES modules for the arcade shell
- Node 22 built-in HTTP server for static hosting and the multiplayer room API
- same-origin JSON polling for room synchronization
- localStorage for guest identity and progression
- one parameterized mini-game runtime powering 18 catalog entries
- Docker for a single-instance deployable artifact
- zero third-party runtime packages or required credentials

## Deliberate differences

- Original CSS-drawn egg avatar instead of copied art.
- No copied logos, music, 3D models, sprites or game assets.
- No account wall in Phase 1.
- No payments or external creator marketplace yet.
- Rooms are intentionally in-memory in Phase 1; durable distributed room state is a later scale requirement.
