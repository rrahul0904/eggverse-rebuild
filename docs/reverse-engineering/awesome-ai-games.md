# Awesome AI Games → Eggverse external discovery layer

Status: research contract / implementation pending  
Tracker: RE-224  
Issue: #2  
Source Reddit post: https://www.reddit.com/r/coolgithubprojects/s/2aHWtrzP4w  
Primary upstream reference: https://github.com/aviaryan/awesome-ai-games  
Research date: 2026-09-23

## 1. What the source actually is

`aviaryan/awesome-ai-games` is a curated catalog of AI-made browser games, not a game engine or hosted game store. At the time of review it exposes a README-driven list, an `images/` directory, contributor rules and Git metadata.

The public catalog currently contains 22 entries across:

- 5 racing games
- 5 first-person shooters
- 4 other remakes/inspired-by games
- 8 original games

Its useful product primitive is the **curation contract**: a listing should be a genuinely playable browser game, the play link should still work, public discovery evidence should exist, launch timing should be source-backed, and the listing should include one bounded gameplay image.

This is therefore a capability donor for Eggverse's discovery layer, not a reason to create another standalone arcade runtime.

## 2. Verified curation mechanics

The upstream contributor guide establishes a human-reviewed, high-signal workflow:

- reject non-game demos, shader showcases and passive flythroughs
- prefer games with visible public reception
- verify the play URL before accepting a listing
- require a real source/discovery post
- keep launch dates explicitly approximate and source-backed
- keep descriptions concise and structured
- attach one gameplay image with size/format constraints
- require a pull request explaining why the entry meets the bar

Those mechanics translate well into a real product as moderation state, provenance and health evidence.

## 3. Browser-game implementation patterns observed

The catalog itself is static, but representative listed games show a repeatable modern browser-game stack:

### Rendering

- Three.js + WebGL/WebGL2 is common for 3D games.
- Some projects generate most visual/audio content procedurally at runtime.
- DOM/CSS remains useful for HUD and menus around the canvas.

### Physics / interaction

- Lightweight projects use custom collision/character logic.
- More advanced racers use physics libraries such as Rapier.
- Keyboard/mouse/gamepad support is common; mobile performance modes appear in racing titles.

### Multiplayer

- Small multiplayer games can use worker/server backends for room state.
- Voice or lobby features appear in some FPS titles, but must be treated as separate hosted/runtime capabilities rather than assumed catalog behavior.

### AI-assisted development

The source describes games built with tools/models such as Claude, GPT-family systems and agentic coding workflows. Treat those as **creator claims with provenance**, not as a property we infer automatically.

A representative open-source title, `mshumer/Claude-of-Duty`, documents a Three.js/WebGL2 FPS with modular render/material/world/physics/player/weapons/AI/UI/audio subsystems and a browser-based visual/performance test harness. That is useful architecture evidence for future native Eggverse games, but it is not required for the external directory MVP.

## 4. Existing Eggverse fit

Current Eggverse already has:

- an 18-game data-driven internal catalog
- reusable playable modes
- responsive catalog/detail/profile/rewards surfaces
- local guest identity and progression
- server-authoritative multiplayer room progress
- reconnect/presence support
- deterministic daily challenges
- scoreboards and persisted state
- security headers, bounded input handling, tests, CI and Docker packaging

The missing layer is **external discovery**: cataloging independent browser games with source evidence, health status, creator identity and moderation.

## 5. Clean-room product model

Do not copy the upstream README prose, screenshots or repository structure. The upstream top-level repository does not expose a license file at review time, so use it as a behavioral reference only.

### ExternalGame

Suggested fields:

- `id`
- `slug`
- `title`
- `creatorId`
- `playUrl`
- `sourceUrl`
- `sourceType`
- `genre`
- `originality` = original | inspired_by
- `inspiredBy` (free text, optional)
- `description` (independently authored or creator-supplied)
- `supportedDevices`
- `inputMethods`
- `rendererTechClaims`
- `aiToolClaims`
- `launchDateApprox`
- `firstSeenAt`
- `lastVerifiedAt`
- `healthStatus`
- `moderationStatus`
- `rightsStatus`
- `thumbnailAsset`
- `featuredUntil`
- `createdAt`
- `updatedAt`

### Evidence

Every non-trivial claim should be attributable:

- evidence URL
- evidence type
- observed/claimed value
- captured timestamp
- verification status
- moderator note

### Moderation states

`submitted -> evidence_pending -> review_ready -> approved -> listed`

and failure paths:

`rejected`, `delisted`, `dead_link`, `rights_hold`

## 6. Phase A user experience

### Player

1. Open **Discover**.
2. Search/filter by genre, device/input and originality.
3. Open a game card/detail page.
4. See creator, provenance, last link check and high-level compatibility.
5. Press **Play** and leave Eggverse for the verified external URL.

Phase A should use outbound links. Do not iframe arbitrary third-party games until CSP/frame policies, privacy, permissions and malicious-content isolation are explicitly handled.

### Creator

1. Submit a play URL.
2. Add creator identity, description and source evidence.
3. Declare AI tooling only when the creator can support the claim.
4. Supply media they own or are licensed to use.
5. Receive review status.

### Admin

1. Review duplicate candidates.
2. Check URL safety and liveness.
3. Review provenance.
4. Review rights/media declaration.
5. Approve/reject/hold.
6. Delist stale or unsafe games.

## 7. Health and safety boundary

Link health must be deterministic and server-side.

Minimum contract:

- only `https://` by default
- reject loopback/private/link-local/reserved destinations
- resolve redirects with bounded hop count
- cap response size/time
- never forward Eggverse credentials/cookies
- record status without executing arbitrary downloaded content
- separate "URL is reachable" from "game is playable"

A browser smoke probe can later verify that a page renders and exposes an expected playable surface, but that requires a sandboxed browser worker and explicit evidence.

## 8. Competitive product signals

Current public products confirm that this category is already moving beyond simple lists:

- https://aibuiltgames.com/ — searchable/category-driven directory, bookmarks/upvotes and paid featured placement; it currently advertises a $29 featured option.
- https://vibeany.games/ — searchable/sortable browser-game library with device guidance and submissions.
- https://unispawn.io/publish — hosted publishing model with human review and an advertised 85% creator / 15% platform subscription split.
- https://fortcade.com/about/ — curated AI/indie browser-game discovery hub.

These are market references, not implementation donors. Eggverse should differentiate on **verified provenance + link health + trusted moderation + social/challenge integration**.

## 9. Monetization hypotheses (not implemented)

Keep Phase A free and evidence-first. Later options:

- clearly labeled sponsored/featured slots with ranking separation
- creator analytics/pro profiles
- premium creator submission tools
- hosted builds only after sandboxing and malware/content scanning exist
- subscription revenue share only after durable play-time measurement and creator verification exist

Do not claim paid featuring, creator payouts or hosted games before they have production payment, moderation and accounting evidence.

## 10. IP / brand rules

The catalog contains many "inspired by" remakes. Eggverse should therefore:

- avoid implying affiliation with original publishers
- require creator rights/media declarations
- use independently authored descriptions
- prefer creator-provided or open-licensed screenshots
- retain evidence for source/creator claims
- provide a takedown/contact path
- support fast delisting on rights disputes
- avoid cloning trademark-heavy artwork or proprietary assets into Eggverse-hosted games

## 11. Phase A repository slice

Smallest useful implementation:

1. add `ExternalGame` + evidence/moderation schemas
2. seed a handful of independently researched listings
3. add Discover search/filter/detail views
4. add outbound Play flow
5. add deterministic normalize/dedupe rules
6. add SSRF-safe link-health service contract
7. add creator submission payload + admin moderation states
8. add tests and exact-head CI evidence

Explicitly out of scope for this slice:

- automated scraping/discovery
- arbitrary third-party iframe execution
- hosted zip uploads
- creator payouts
- paid featuring
- AI ranking/recommendation
- anti-cheat certification

## 12. Certification evidence

Repository-certified Phase A should capture:

- schema/unit tests
- normalize/dedupe fixtures
- URL validation + redirect/private-address rejection tests
- health-state transition tests
- catalog/search/filter browser tests
- submission/moderation authorization tests
- exact-head CI run
- screenshot or browser evidence for Discover -> Detail -> outbound Play
- statement that external runtime safety, monetization and hosted execution remain uncertified

## 13. Next implementation action

Implement the data model and read-only external Discover surface first. Use 3–5 independently researched seed entries with original copy and safe outbound links. Add health-check and submission/admin mutations only after the read path is deterministic and covered.

That is the smallest truthful step that turns this donor from research into native Eggverse capability without overstating a hosted game marketplace.
