# CONTEXT.md — Realistic Top-Down Battle Royale (Web, Browser-Only)

> Vocabulary for this effort — use these terms in issues, specs, and code. Synonyms the glossary avoids are noted.

## Glossary (Ubiquitous Language)

- **Match** — One solo instance: spawn → loot → zone shrinks → fight → last alive wins. Target 8–10 min for 10 players on one small map. *Avoid: game, round.*
- **Spawn** — Random scattered placement at match start with 2s invulnerability. No airdrop plane v1. *Avoid: drop.*
- **Loot** — Ground-placed weapons/gear, high density — gun within ~5s of spawn. Tiered: Common (pistol/SMG baseline), Rare (AR), Epic (Sniper + plates). Includes crates/ground spots.
- **Weapon Class** — Military-sim set v1: **AR** (versatile mid-range), **Shotgun (SG)** (close burst), **Sniper (SR)** (long, slow). Distinct roles, no SMG/LMG v1.
- **TTK (Time-to-Kill)** — Fast military-sim: **0.6s unarmored / 1.1s armored** (~3–4 rifle hits kill unarmored, armor adds ~2 hits). Server-validated hitscan @ 20Hz.
- **Armor / Plates** — Pick-up plates absorb damage before HP. Use before or between fights.
- **Healing** — **Bandage** 3s interruptible cast (small heal), **Medkit** 6s interruptible (full heal). Interrupt on damage/movement. No fast/instant heals, no passive regen — stops heal-spamming in final zone.
- **Zone (Circle)** — Shrinking playable area. **3 phases** for 8-min: Phase 0 (0–2 min) large, Phase 1 (2–5 min) medium, Phase 2 (5–8 min) final ~30% map. Damage ticks up each phase; lethal 10s after close. *Avoid: storm.*
- **Phase** — One zone state between shrinks.
- **POI (Point of Interest)** — Named map area with role. **For this map: 5 POIs on 800×800m (~50×50 tiles) — 1 hot center `Citadel` + 4 edge `North Depot`, `East Yard`, `South Outpost`, `West Fields`**, connected by cross roads (8m) and cover grammar. Hot richer loot, edges lean.
- **Cover** — Hard (walls/containers/buildings) blocks LOS **and** bullets; soft (foliage/tall grass) blocks sight only. **For this map: medium density, ~120m sight caps (7–8 tiles), ~40% inter-POI cover — no 200m lanes, not maze-like.**
- **Controls** — **WASD + mouse aim** — move with WASD, turn/aim with mouse, fire on mouse click. Input buffered per tick (20Hz). *Avoid: click-to-move.*
- **Camera** — **Follow tight** with mouse-direction look-ahead — camera centered on player, shifts toward cursor. Not fixed, not loose wide.
- **FOV / Fog-of-War** — **120° forward cone + occlusion** — walls block sight and bullets (hard cover), foliage blocks sight only (soft). Outside cone is fogged; hard cover casts shadow. 360° vision explicitly excluded for realism.
- **Aiming / Spread** — **No ADS toggle v1** — always aimed, spread fixed with movement/fire penalty, no recoil pattern to learn. Simple, matches fast TTK.
- **Line-of-Sight / FOV** — See FOV/Fog-of-War above; drives sight checks per tick.
- **Tick** — Server authoritative simulation step at **20Hz** (50ms) over WebSocket (Colyseus/ws), snapshot-interpolated to 60fps render (PixiJS).
- **Authoritative Server** — Node shard is source of truth; client inputs validated, no client prediction v1.

## Decisions Reflected Here

- Spawn = scattered random (Ticket #6).
- Loot = high-density ground (Ticket #6).
- TTK fast 0.6/1.1 (Ticket #6).
- Zone 3-phase 0-2-5 (Ticket #6).
- Armor plates + bandage/medkit interruptible (Ticket #6).
- Weapon classes AR/SG/SR (Ticket #6).
- Win = last alive, zone lethal (Ticket #6).
- Controls WASD+mouse, tight follow, cone FOV+occlusion, no ADS fixed spread (Ticket #7).
- Netcode 20Hz WS + snapshot interpolation (Ticket #3).
- Rendering PixiJS v7 + tilemap (Ticket #2).

## Out-of-Scope Language (do not use for this map)

- Persistence, battle pass, accounts — no progression vocabulary v1.
- Mobile touch, voice, spectator terms — parked.
