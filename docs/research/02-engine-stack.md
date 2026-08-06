# Research — Web Rendering & Engine Stack for Top-Down BR (Ticket #2)

**Ticket:** [#2 — Web rendering & engine stack](https://github.com/BlockedPath/test2/issues/2) · Part of [#1 Map](https://github.com/BlockedPath/test2/issues/1)  
**Date:** 2026-08-06 · **Branch:** `research/engine-stack` · **Status:** Decision recommended for spec  
**Goal:** 60fps, military-sim top-down, 10–20 players, one small handcrafted map, browser-only no install, authoritative 20Hz (#3)

## Summary Recommendation

**Default for spec: PixiJS v7 (+ `@pixi/tilemap` / `pixi-tilemap`) with a thin custom game loop/input/collision layer — WebGL renderer, HTML/CSS overlay for HUD.**  
**Acceptable alternative:** Phaser 3 if you want batteries-included (tilemap + input + sound + scene) and accept ~1.2 MB vs ~450 KB bundle and slightly lower sprite-batch ceiling.

**Not recommended:** Three.js OrthographicCamera for pure 2D — GPU-accelerated and capable of tens of thousands of sprites, but adds 3D matrix/shader overhead for no gain unless you plan 2.5D shadows/lighting; Canvas 2D (CPU, ~few thousand draw calls) fails at scale. Custom bare WebGL is re-building Pixi.

**Spec language:**
> **Rendering:** PixiJS v7 WebGL renderer, `BatchRenderer` multi-texture batching, sprite sheets/atlas, `@pixi/tilemap` for tiled terrain, HTML overlay HUD (hybrid approach). Fallback to Canvas via Pixi auto-detection. Input: native keyboard/mouse via Pixi InteractionManager. Physics/collision: custom AABB + ray-cast for LOS (no full physics engine v1). Bundled via Vite, treeshaken Pixi imports.

## Evidence Matrix

| Stack | Type | Rendering | Tilemap | Sprite batching / 60fps ceiling | Bundle (gz est.) | Input/FOV/Lighting | Trade-offs |
| ------- | ------ | ----------- | --------- | ---------------------------------- | ------------------ | -------------------- | ------------ |
| **PixiJS v7** | Renderer only | WebGL (highly optimized), auto batching + texture management, Canvas fallback | Via `@pixi/tilemap` / `pixi-tilemap` (you wire) | Highest raw throughput — wins sprite-heavy benchmarks by significant margin; designed for thousands of sprites/particles | **~450 KB** (treeshaken smaller) — fastest load | InteractionManager for input; FOV/lighting via custom shaders/masks; you build collision | **Pros:** fastest batch, smallest bundle, explicit control, fits authoritative snapshot interpolation. **Cons:** you build tilemap/input plumbing, hiring pool smaller than Phaser |
| **Phaser 3** | Full framework | WebGL multi-texture batching (Dev Log 242: sprites+text+tilemaps batched), Canvas fallback | Built-in Tiled integration, WebGL tilemap renderer | 60fps capable, slightly below Pixi at extreme densities | **~1.2 MB** | Built-in input, cameras, lighting plugin, sound | **Pros:** batteries-included, larger hiring community, proven BR-like surviv.io lineage. **Cons:** bigger bundle, opinionated scene lifecycle, less batch headroom |
| **Three.js Orthographic** | 3D engine in 2D mode | WebGL OrthographicCamera, GPU, handles tens of thousands objects | No tilemap — you build grid or import | GPU, high ceiling, but 3D matrix per sprite | ~600–800 KB + app | Orthographic sprites/meshes, shader lighting | **Pros:** if 2.5D shadows/height needed. **Cons:** overhead for pure 2D, no 2D tilemap/physics, complexity |
| **Bare Canvas 2D** | API | CPU-driven, ~few thousand draw calls before drop | Manual | CPU-bound, hitches on intense animation | ~0 | Manual | Only for prototype; not for 10–20 player bullets+players+map at 60fps |
| **Custom WebGL** | DIY renderer | You write batcher | You write | As good as you make it | Minimal | You write everything | Rebuilding Pixi — not justified for small map |

Sources: Pixi vs Phaser throughput + batching [js-game-rendering-benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)[Abratabia Pixi vs Phaser](https://www.abratabia.com/pixijs/pixijs-vs-phaser.php)[Phaser Dev Log 242](https://phaser.io/devlogs/242)[Pixi Performance Tips](https://pixijs.com/7.x/guides/production/performance-tips); Canvas vs WebGL capacity & hybrid HUD pattern [Simplified Media Canvas vs WebGL](https://simplified.media/guides/canvas-vs-webgl)[Three.js forum Sprite vs Mesh](https://discourse.threejs.org/t/sprite-vs-mesh-for-orthographic-camera-and-without-lighting/87517); tilemap requirements + bundle sizes [Abratabia](https://www.abratabia.com/pixijs/pixijs-vs-phaser.php)[fgfactory WebGL libraries](https://fgfactory.com/webgl-libraries-for-2d-games)[pixi-tilemap repo](https://github.com/pixijs/pixi-tilemap/); Three.js orthographic handling tens of thousands [FastForwardLabs 2D with Three.js](https://blog.fastforwardlabs.com/2017/10/04/first-look-using-three.js-for-2d-data-visualization.html).

### Performance & Budget Implications (10 players, one map)

- **Draw calls:** Pixi batcher keeps static tilemap + batched sprites in few draw calls; Phaser similar but batches across types, still few. Either hits 60fps easily for ~200–400 sprites (players+bullets+trees). Bare Canvas would be ~1k draw calls = risk.
- **Load time:** Pixi ~450 KB vs Phaser ~1.2 MB matters for no-install first load; Vite code-splitting helps both, but Pixi edge is real.
- **Memory:** Pixi texture atlas (e.g., 2048×2048 per atlas) + tilemap GPU upload once; runtime <50 MB. Phaser similar.
- **Hiring:** Phaser developers more plentiful for full game logic; Pixi + custom loop favors web engineers comfortable gluing systems.

### FOV / Lighting / Military-sim Fit

- Both Pixi and Phaser support masks/shaders for FOV cone/hard shadows — custom shader, not built-in realistic lighting. No engine gives military-sim realism for free; art + shader decide. Pixi gives lower-level shader access, Phaser has Light2D plugin but adds cost.

## What This Unblocks

- #4 (perf budget) can now size GPU/draw-call budget assuming PixiJS WebGL.
- #5 (assets) can assume atlas/2048 tiles, tile size 32/64, png + json atlas.
- #6/#7/#8 (loop/controls/map) can assume snapshot-interpolation rendering of 20Hz authoritative snapshots.
- #9 (hosting) unchanged, but client bundle size feeds CDN cost.

## Risks & Next Verifications

- Pixi-only requires building tilemap loader — validate `@pixi/tilemap` with Tiled JSON before locking spec.
- If 2.5D height (cliffs, multi-floor POIs) becomes required, revisit Three.js orthographic — YÔag wrong decision otherwise.
- Perform 400-sprite benchmark on target device (Chrome desktop 60Hz) with chosen stack to confirm <16ms frame.

## References

- Benchmarks & comparisons: Shirajuki js-game-rendering-benchmark, Abratabia Pixi vs Phaser, Phaser Dev Logs 67/242, Pixi BatchRenderer docs.
- Canvas vs WebGL trade-offs: Simplified Media, Three.js forum.
- Tilemap: pixi-tilemap, pixi-tilemap docs, FGFactory WebGL libraries.
- Bundle/size: Abratabia comparison (1.2 MB vs 450 KB).

*Artifact on `research/engine-stack` — see repo `docs/research/02-engine-stack.md`. Closes #2.*
