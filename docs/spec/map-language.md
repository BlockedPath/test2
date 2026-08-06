# Map Language — One Small 10-Player Map (Ticket #8)

**Map #1:** <https://github.com/BlockedPath/test2/issues/1> · **Ticket #8:** <https://github.com/BlockedPath/test2/issues/8> · **Depends on #2 (PixiJS), #6 (loop), #7 (controls cone)**
**Decision:** Small 800×800m (~50×50 tiles @ 16m/tile or 32px grid), 5 POIs (1 hot center + 4 edge), medium cover 120m sight caps, hot-richer loot heatmap — makes 8-min + scattered spawn + high-density loot reliably fightable.

## Dimensions & Grid

- **Playable:** 800×800m square (~640k m²). For engine: 50×50 tiles at 16m/tile (or 64 tile grid at 12.5m). At 32px per tile, ~1600×1600 px world texture before detail.
- **Traversable:** Edge ring spawns already give distribution — no extra padding needed. Zone final 30% is ~440×440m (≈14×14 tiles).
- **Why small:** Matches 10 players + scattered spawn + 5s to gun: median encounter ~30s. 1200×1200 would dilute to 60s+ and break 8-min. Validated vs TTK 0.6s and cone FOV.

## POIs (5)

- **Center Hot:** `Citadel` (2-story concrete, courtyard) — AR/SR + plates high density, holds ~3 players contesting. Riskiest, richest.
- **Edge POIs (4, cardinal):**
  - `North Depot` — warehouse row, linear cover, AR common
  - `East Yard` — container maze, SG bias, tight
  - `South Outpost` — L-shaped barracks, balanced
  - `West Fields` — foliage + low walls, SR sight 120m, leaner loot but safe rotation

Roles: hot center drives early fights; edges allow safe starts with pistol→AR progression; each edge has road to center.

## Grammar: Roads, Cover, Foliage, Sightlines

- **Roads:** Cross center (N-S, E-W) 8m wide, connect POIs — loot-light (forces POI looting, guides rotation, marks zone path).
- **Hard Cover (walls, containers, buildings):** Blocks LOS + bullets. Spaced to cap sightline to **~120m** max (7–8 tiles). No 200m lane except W Fields edge.
- **Soft Cover (foliage, tall grass):** Blocks sight only within cone, not bullets — allows cone FOV ambush without wall-hugging maze.
- **Sight Budget:** ~120m cap ensures cone occlusion matters and SG/AR roles hold; Sniper still viable across Fields but not cross-map.
- **Density:** Medium — ~40% of inter-POI terrain has cover, not maze-like; movement with WASD remains fluid, cone peeking rewarded.

## Loot Heatmap (high-density ground)

- **Hot center:** 2× Epic (SR/rare AR + plates), 4× Rare AR, bandages — risk/reward.
- **Edge POIs:** 1× Rare AR, 2× Common (pistol/AR), 1× plates/bandage — edge-lean, guarantees gun in ~5s without hot-drop.
- **Inter-POI / roads:** sparse crates only (bandage + ammo) — discourages looting on road, pushes toward POIs.
- **Total:** High density inside POIs, lean outside — supports 8-min loop and last-alive win.

## Zone Coherence (from #6: 3 phases 0-2-5)

- Phase 0 (0–2 min): full 800×800, no damage — loot.
- Phase 1 (2–5 min): shrink to ~70% (~670×670), tick damage low.
- Phase 2 (5–8 min): shrink to final 30% (~440×440) centered dynamically (bias to contested POI). Damage lethal 10s after close — forces last-alive showdown in 120m sight grid.

## Sketch Reference (not final art)

```
800m x 800m — 50×50 tiles
W Fields ----- N Depot
  |  \ foliage|warehouse |
  |   \  SR  /   AR      |
  |    Citadel (HOT) ← center ~ 160×160m
  |    /  \     \
S Outpost ---- E Yard
 roads N-S/E-W, walls cap 120m, cone FOV 120°
 loot: ★ center rich, ○ edges lean
```

*Spec artifact for #8 — see `docs/spec/map-language.md` @ main and CONTEXT.md POI/cover. Enables build without reopening map decisions.*
