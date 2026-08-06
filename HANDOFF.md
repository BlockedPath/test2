# Handoff — Realistic Top-Down Battle Royale (Web, Browser-Only) — Wayfinder Way Clear

**Map:** [Wayfinder Map #1 — Realistic Top-Down Battle Royale (Web, 10–20 players, browser-only) #1](https://github.com/BlockedPath/test2/issues/1) — **8/8 decisions closed, way clear**  
**Destination:** Build-ready spec so an agent team can implement without reopening core decisions  
**Date:** 2026-08-06 · **Branch:** `main` (artifacts on `research/*` + `main`)

## One-page decisions (in build order)

| # | Decision | Gist | Artifact |
| --- | ---------- | ------ | ---------- |
| 3 | **Netcode** | Authoritative Colyseus/`ws` over WebSocket at **20Hz**, snapshot interpolation to 60fps, hitscan no rewind v1; WebRTC deferred | [`docs/research/03-netcode.md` @ `research/netcode-authoritative`](https://github.com/BlockedPath/test2/blob/research/netcode-authoritative/docs/research/03-netcode.md) |
| 2 | **Rendering** | **PixiJS v7 + `@pixi/tilemap`** default (WebGL batched, hybrid HTML HUD); Phaser 3 alternative considered, Three.js/Canvas deferred | [`docs/research/02-engine-stack.md` @ `research/engine-stack`](https://github.com/BlockedPath/test2/blob/research/engine-stack/docs/research/02-engine-stack.md) |
| 6 | **Core loop** | Scattered random spawn +2s invuln, high-density ground loot (gun ~5s), AR/SG/SR, fast TTK **0.6s/1.1s**, plates+bandage/medkit interruptible, **3-phase zone 0-2-5 to 30%**, last alive wins | [`CONTEXT.md` @ `main`](https://github.com/BlockedPath/test2/blob/main/CONTEXT.md) |
| 7 | **Controls** | **WASD+mouse aim**, tight follow + look-ahead, **120° cone FOV+occlusion** (hard walls block LOS+bullets, foliage soft), no ADS fixed spread | [`CONTEXT.md` @ `main`](https://github.com/BlockedPath/test2/blob/main/CONTEXT.md) |
| 8 | **Map** | **800×800m (~50×50 tiles)**, 5 POIs (hot `Citadel` + 4 edge `North Depot/East Yard/South Outpost/West Fields`), **medium 120m caps**, hot-richer heatmap, cross roads | [`docs/spec/map-language.md` @ `main`](https://github.com/BlockedPath/test2/blob/main/docs/spec/map-language.md) + `CONTEXT.md` |
| 4 | **Perf budget** | **10–30 KB/s down / 0.3–1 up per player**, ≤1ms tick, ≤50/100 draw calls, ~10 MB/room; start **≤25 rooms/vCPU** | [`docs/research/04-perf-hosting.md` @ `research/perf-hosting`](https://github.com/BlockedPath/test2/blob/research/perf-hosting/docs/research/04-perf-hosting.md) |
| 5 | **Art pipeline** | **Kenney CC0 immediate**, one **GameDeveloperStudio family in private vault (never public)**, deterministic **2048 atlases 64px canonical**, naming/manifest/style bible, AI gap-fill isolated (Unity/CraftPix AI blocked) | [`docs/research/05-asset-pipeline.md` @ `research/asset-pipeline`](https://github.com/BlockedPath/test2/blob/research/asset-pipeline/docs/research/05-asset-pipeline.md) |
| 9 | **Hosting** | **Warm Fly.io 1× ≤25 rooms/vCPU** (or VPS if 1–2 regions), room=shard, Redis ≥2 processes, lifecycle `create→tick→drain→destroy`, scale to 100, observability | [`docs/spec/hosting-infra.md` @ `main`](https://github.com/BlockedPath/test2/blob/main/docs/spec/hosting-infra.md) |

## Vocabulary (canonical)

See [`CONTEXT.md`](https://github.com/BlockedPath/test2/blob/main/CONTEXT.md) — Match, Spawn, Loot, Weapon Class (AR/SG/SR), TTK, Armor/Plates, Healing (bandage/medkit), Zone/Phase, POI, Cover (hard/soft), Controls, Camera, FOV/Fog, Aiming, Tick (20Hz), Authoritative Server. Use these terms in code/issues.

## What’s out of scope for this build

Persistence/accounts/battle pass, mobile tuning, voice, spectator, bots, squads, replays/modding, monetization beyond authoritative server.

## Fog that graduates as build tickets

- Lobby & matchmaking (queue, ready-check, start, backfill, reconnect) — **first build ticket below**
- Sound & VFX language
- Playtest validation plan

## How to build (agent team)

1. Start from `CONTEXT.md` vocabulary + `docs/spec/*` + `docs/research/*` — do not re-decide #2–#9.
2. Implement in order: **lobby → authoritative room (20Hz) → PixiJS scene (tilemap) → movement/aim/FOV → zone/loot → hosting deploy**. Keep tick + render budgets from #4.
3. Keep private vault `asset-vault/` out of public repo; inject paid art only in release CI (see #5).

## First build ticket

[#10 — Build — Lobby & matchmaking flow for 10–20](https://github.com/BlockedPath/test2/issues/10) — scaffolded. Claim with `gh issue edit 10 --add-assignee @me`.

---
*Generated from Wayfinder Decisions so far on #1 — each line gists its ticket artifact; zoom the link for full detail.*
