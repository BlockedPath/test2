# Research — Authoritative Netcode for 10–20 Player Browser BR (Ticket #3)

**Ticket:** [#3 — Research — Authoritative netcode for 10–20 players](https://github.com/BlockedPath/test2/issues/3) · Part of [#1 Map](https://github.com/BlockedPath/test2/issues/1)  
**Date:** 2026-08-06 · **Branch:** `research/netcode-authoritative` · **Status:** Decision recommended for spec  
**Preference:** Authoritative server (no P2P/host-authoritative for v1)

## Summary Recommendation

**Use Colyseus (or custom Node + `ws`/`uWebSockets.js`) over WebSocket (TCP), authoritative at 20Hz fixed tick, with snapshot interpolation — no client prediction/reconciliation and no server rewind for v1.** This satisfies 10–20 players, 8–10 min matches, military-sim top-down realism without turning netcode into a second project.

- **Transport:** WebSocket (reliable, ordered TCP). WebRTC DataChannel's unreliable/unordered UDP-like mode avoids head-of-line blocking and is technically superior for shooters where stale updates should be dropped, but requires signaling + STUN/TURN + NAT handling — disproportionate complexity for 20 players at this scope. Colyseus defaults to WebSocket; its WebRTC transport is experimental.
- **Tick:** 20Hz server (`setSimulationInterval(50ms)`) with client render at 60fps interpolated between snapshots. Deterministic tick decoupled from render; client lerps (`Lerp`/snapshot-interpolation `geckosio/snapshot-interpolation`) to smooth 20 → 60.
- **Authority:** Server is source of truth. Client sends inputs with timestamp; server validates, simulates, delta-compresses state. No host-authoritative P2P — avoids cheating and host-migration.
- **Hits:** **Hitscan** for rifles/SMGs (server ray-cast against current tick state, no rewind). If projectile (grenade/rocket) later, buffer 150–200ms of past states for server-side rewind — not required for v1 hitscan.
- **Alternatives ruled out:** Nakama — heavier (Go runtime, extra service) and requires manual broadcasts; colyseus fits Node + browser TS SDK best. Custom `ws`/`uWS` is viable if you want zero framework lock-in, but you reimplement rooms/matchmaking Colyseus gives you.

## Evidence Matrix

### Engine / Framework

| Stack | Authority | Transport | Tick model | Pros | Cons | Fit for this spec |
| ------- | ----------- | ----------- | ------------ | ------ | ------ | ------------------- |
| **Colyseus** | Authoritative Node.js rooms, `Schema` sync | WebSocket (default), reliable | `setSimulationInterval`, fixed timestep | Schema delta-compression, rooms/matchmaking built-in, TS SDK, 20Hz pattern documented, aligns with browser | TCP HOL blocking; server cost per room | **Recommended** — smallest spec risk |
| **Custom `ws`/`uWS`** | You write authoritative loop | WebSocket (TCP) | Your `setInterval(50)` | No framework, full control, tiny bundle | Rebuild presence/rooms/reconnect | Viable if you avoid Colyseus lock-in |
| **Nakama** | Authoritative (Go/Lua/TS) | WebSocket | Configurable tick | Matchmaker, groups, leaderboard out of box | Operational weight, Go plugin model, manual state sync | Overkill for 10–20 solo BR v1 |
| **WebRTC DataChannel** | Could be authoritative but signaling complexity | UDP-like unreliable/unordered | Own | Bypasses HOL, best for stale-data discard | Signaling + STUN/TURN + ICE, TURN relays cost/latency, server endpoint complexity | Defer — revisit at 80–100 players or competitive TTK |

Sources: Colyseus authoritative framework via WebSockets with `setSimulationInterval` at 20Hz and interpolation to browser fps [colyseus/colyseus](https://github.com/colyseus/colyseus/)[docs.colyseus.io Fixed Tickrate](https://docs.colyseus.io/learn/tutorial/phaser/fixed-tickrate)[DeepWiki client interpolation](https://deepwiki.com/colyseus/docs/4.2-client-side-patterns); WebSocket vs WebRTC trade-offs (TCP HOL vs unreliable UDP-like, STUN/TURN complexity) [Cinevva browser game guide](https://app.cinevva.com/guides/multiplayer-browser-game)[PhyFun io architecture](https://phyfun.com/blog/io-games-architecture-technical-deep-dive)[Abratabia netcode comparison](https://www.abratabia.com/multiplayer-web-games/)[Web Game Dev WebRTC](https://www.webgamedev.com/backend/webrtc); spectator/replay lag patterns relevant.

### Lag Compensation Scope

| Technique | What it does | When you need it | For this top-down 10–20 |
| ----------- | -------------- | ------------------ | -------------------------- |
| **Snapshot interpolation** | Client interpolates between last two server states (e.g., `geckosio/snapshot-interpolation`) | Always at < render fps (20 → 60) | **Yes** — required, cheap |
| **Client-side prediction + reconciliation** | Client simulates own inputs immediately, rewinds & replays unacked inputs on server correction | Fast local feel, hides RTT; needed when input→feedback must be <50ms | **No for v1** — top-down with hitscan and 40–80ms RTT tolerates 50ms interpolation delay; add only if playtest shows “spongy” movement |
| **Server rewind (lag compensation)** | Server buffers past states, rewinds target positions to shooter's view at fire time | Needed for projectile / high-TTK fairness | **No for v1 hitscan** — ray-cast against current state is sufficient at 20Hz with 10–20 players; add 150–200ms rewind buffer only if adding projectiles |

Sources: Client prediction/reconciliation rewinding & replaying inputs [Gabriel Gambetta CSP](https://gabrielgambetta.com/client-side-prediction-server-reconciliation.html)[WPI top-down shooter lag study](https://web.cs.wpi.edu/~claypool/mqp/lag-comp-19/report.pdf); lag compensation / rewind buffering [Gabriel Gambetta lag comp](http://www.gabrielgambetta.com/fpm4.html); input buffer & prediction policies.

## Recommended Spec Language (copy-paste)

> **Netcode:** Authoritative Node.js shards (Colyseus `Room` or custom `ws` equivalent), WebSocket transport, 20Hz fixed tick (`50ms`), delta-compressed schema sync. Clients send `{seq, input, ts}` at input rate; server validates and broadcasts snapshot. Clients render at display fps interpolating between snapshots. No client prediction/reconciliation v1. Hit validation: server ray-cast hitscan against current tick; no rewind buffer. Projectile weapons deferred to post-spec and would require 150–200ms rewind buffer. Tick documented via `setSimulationInterval` pattern; interpolation via `snapshot-interpolation` or `Lerp`.

## Risks & Follow-ups

- **HOL blocking at packet loss:** WebSocket TCP will stall. Mitigate with small snapshots (delta compression) and keeping snapshot < MTU. If playtest shows hitching at 2% loss, revisit WebRTC unreliable channel for state only (keep reliable channel for inputs).
- **Tilt if RTT >100ms:** 20Hz + interpolation adds ~50ms. With 80ms RTT, feedback is ~130ms. Acceptable for top-down military-sim; if not, add lightweight client prediction for own player only.
- **Colyseus lock-in:** Schema is opinionated. If you want zero framework, spec the custom `uWS` path equivalently (room, presence, reconnect, delta diff).
- **Hosting coupling:** Decision enables #4 (perf/hosting) and #9 (infra shape) — see `docs/research/04-perf-hosting.md` next.

## What This Unblocks

- #4 (perf budget) and #9 (hosting) can now size per-tick CPU/bandwidth at 20Hz.
- #6 (core loop) can lock TTK/hitscan vs projectile assuming server-authoritative hitscan.
- #7/#8 (controls/map) can assume server-validated movement.

## References

- Colyseus docs — Fixed Tickrate, Client-Side Patterns, WebSocket transport.
- Cinevva / PhyFun / Abratabia — WebSocket vs WebRTC authority trade-offs.
- Gabriel Gambetta — Client-Side Prediction & Server Reconciliation; Lag Compensation (rewind).
- WPI MQP — Time Warp and Prediction Analysis in Top-Down Shooter.
- `geckosio/snapshot-interpolation`, `timetocode/nengi-2d-csp`, `PurrNet` prediction policies.

*Artifact on `research/netcode-authoritative` — see repo `docs/research/03-netcode.md`. Closes #3.*
