# Research: Ticket #5 — Military-sim top-down asset pipeline (store/AI)

## Summary

Use **Kenney CC0 assets immediately** for prototypes and anything that must live in the public repository. For production coherence, license **one GameDeveloperStudio top-down military family** and inject it from a **private, access-controlled source vault**; never commit its source files or derived atlases to a public repository. AI should be limited to gap-filling from text and internally authored references: Unity Asset Store and CraftPix assets are expressly prohibited as AI/ML inputs, and GameDeveloperStudio assets should also remain out of external AI services unless the author gives specific written permission.

The recommended build target is deterministic, category-split **2048×2048 runtime atlases**, using one project-wide logical tile profile—preferably **64 px at 1×**, with an optional generated **32 px low-resolution variant**—plus machine-readable frame metadata, a strict naming convention, a license/provenance manifest, and a style bible.

> This is a technical sourcing and repository-control recommendation, not legal advice. Preserve the exact license and receipt in force at the time each asset is acquired, and obtain counsel or written vendor clarification for ambiguous publication models.

## Findings

1. **Kenney is the lowest-risk immediate source for public-repository prototypes.** Kenney states that all assets on its asset pages are public-domain licensed under CC0 and may be used in commercial projects. The relevant catalog is already broad: **Top-down Tanks Remastered** contains 180 files, **Top-down Shooter** contains 580 files, and both are explicitly CC0. CC0 permits copying, modification, and distribution without requiring attribution, although keeping attribution and provenance is still good operational hygiene. [Kenney Support](https://kenney.nl/support) [Top-down Tanks Remastered](https://kenney.nl/assets/top-down-tanks-remastered) [Top-down Shooter](https://kenney.nl/assets/top-down-shooter) [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

2. **The recommended coherent paid family is GameDeveloperStudio’s top-down military catalog.** GameDeveloperStudio says its catalog is made by one creator and emphasizes continuity across thousands of assets. The military subset covers animated soldiers, environment pieces, tanks, and vehicles in mutually compatible visual language:
   - Top-down animated soldiers: **$14.95**, six camouflage styles, multiple weapons, PNG frames and editable/rigged material.
   - Top-down military environment: **$16.95**, HD PNG tilesets and props.
   - Top-down military vehicles: approximately **$5.95**, eight vehicles, PNG and SVG.
   - Top-down tank assets: **$4.95**, three tank and color variations, separated turret/tracks/effects, HD PNG and SVG.
   
   A practical starter family is therefore approximately **$42.80 before discounts or tax**. The SVG/vector and HD/rigged sources are preferable to low-resolution-only packs because they can be normalized cleanly to a 64 px gameplay scale. The main caveat is that environment graphics may need authoring into the project’s exact 64 px tile grammar rather than being inherently grid-ready. [GameDeveloperStudio About](https://www.gamedeveloperstudio.com/about.php) [Animated Soldiers](https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1m6c66581c5k030r3t&page-name=-op-down-animated-soldiers-game-character-pack) [Military Environment](https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1c6q6h7o2f13692k3k&page-name=-op-down-military-environment-assets) [Military Vehicles](https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1t6k6x8j0z0f5x3i7g&page-name=Top-down-military-vehicles) [Tank Assets](https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=116b6v5v419e9j0q3l&page-name=Top-down-tank-game-assets)

3. **GameDeveloperStudio permits commercial, multi-project derivative works, but prohibits redistributing the assets.** Its standard license allows modification, multiple commercial or personal projects, release on multiple platforms under the license holder’s name, and transfer to hired external contributors working on the project. It expressly prohibits sharing or making an asset available for download outside an intended derivative work, including asset libraries, templates, resource packages, courses, and bundles. This means purchased source files cannot enter a public Git repository. A stand-alone atlas in a public repository is also unsafe because it remains a directly reusable collection of the licensed artwork. [GameDeveloperStudio License](https://www.gamedeveloperstudio.com/license.php)

4. **CraftPix is inexpensive and has a fairly coherent military pixel family, but it is a weaker default than GameDeveloperStudio for this project.** The TDS Modern family includes soldiers, vehicles, weapons, terrain, structures, effects, and GUI in one pixel-art theme. Individual related packs are generally listed at **$5.50**; a five-pack slice such as soldiers, tanks, buildings, vehicles, and effects is approximately **$27.50**, while the combined TDS Modern kit or membership may offer different current pricing. CraftPix also has vector top-down assets: its top-down tank pack is 256×256, and a battle-location tileset documents 256×256 tiles and 128×128 or 256×256 objects. Those source resolutions are sufficient to derive 64 px runtime content. [TDS Modern Pixel Game Kit](https://craftpix.net/product/tds-modern-pixel-game-kit/) [Soldiers](https://craftpix.net/product/top-down-soldier-sprites-pixel-art/) [Tanks](https://craftpix.net/product/top-down-tank-sprites-pixel-art/) [Battle Location Tileset](https://craftpix.net/product/battle-location-top-down-2d-tileset-pack-2/) [Vector Tank Pack](https://craftpix.net/product/2d-top-down-tank-game-assets/)

5. **CraftPix source files and derived reusable art may not be publicly redistributed.** Its paid license is limited, non-exclusive, non-transferable, and non-sublicensable. It permits modification, unlimited free/commercial projects, and distribution of games, but states that source distribution is not permitted and forbids distributing original or modified art in a manner usable by another end user. Consequently, neither PSD/AI/EPS/PNG sources nor a plainly downloadable derived atlas belongs in the public repo. Only the minimum art actually needed by the distributed game should be injected into production game packages. [CraftPix File Licenses §1](https://craftpix.net/file-licenses/)

6. **BLOCKER — Unity Asset Store assets cannot be supplied to AI or ML without express consent.** Unity’s current Asset Store terms prohibit using the Asset Store or its assets for AI/ML training and explicitly include gathering, extraction, datasets, “the creation process,” and use “as inputs” to AI/ML programs, for either commercial or noncommercial purposes. Unity’s support article further says not to upload Asset Store content to third-party systems such as Stable Diffusion or Midjourney. This is broader than merely prohibiting model training: image-to-image generation, control/reference input, automated style extraction, embedding, validation, and similar workflows should all be treated as blocked unless both the provider and/or Unity provide the required express permission in writing. [Unity Asset Store Terms and EULA](https://unity.com/legal/as-terms) [Unity AI Training Support Article](https://support.unity.com/hc/en-us/articles/16455448218516-Can-I-use-assets-to-train-AI-models)

7. **BLOCKER — CraftPix likewise expressly forbids AI/ML use.** CraftPix §3.1.1 says licensed assets—including graphics, sprites, animations, tilesets, source files, and derivative works—may not be used for training, fine-tuning, development, testing, validation, or improvement of AI, ML, deep-learning, or generative-AI systems. Do not put CraftPix content into image-to-image tools, ControlNet-like workflows, vision-model analysis, upscalers that use generative models, fine-tuning, style adapters, or prompt/reference pipelines. Ordinary deterministic image tools such as resizing, quantization, palette mapping, trimming, and atlas packing do not present the same AI-input issue. [CraftPix File Licenses §3](https://craftpix.net/file-licenses/)

8. **HIGH — Do not use GameDeveloperStudio assets as external AI input without written permission.** Its published standard license permits human modification and distribution to hired contributors, but does not expressly grant a right to upload the art to an AI vendor or use it to train, condition, validate, or improve a model. The site’s “No AI” declaration describes the catalog as human-made, but it is not an affirmative AI-input license. Because third-party AI uploads may involve copying, vendor processing, retention, or model improvement, the safe gate is written permission identifying the exact provider and workflow. [GameDeveloperStudio License](https://www.gamedeveloperstudio.com/license.php) [No AI Declaration](https://www.gamedeveloperstudio.com/no-ai.php)

9. **AI gap-fill should be isolated from store art and treated as a provenance-heavy, human-finished source class.** Generate only from:
   - Text describing functional and generic visual properties.
   - Internally authored sketches or blockouts whose rights are documented.
   - CC0 references where the exact source and CC0 declaration are recorded.
   - Original palette, silhouette, lighting, and scale rules from the style bible—not copied store images or prompts that demand imitation of a living artist or named vendor family.
   
   An AI provider assigning output rights does not guarantee that an output is copyrightable or non-infringing. For example, OpenAI’s terms assign its rights in output to the user but place responsibility for having rights to the input on the user. The U.S. Copyright Office says prompts alone generally do not provide enough human control for copyright protection, while human-authored modifications, arrangement, and perceptible human expression may be protected case by case. Therefore every accepted AI candidate should receive a documented human redraw/edit pass, similarity review, and source/provenance record. [OpenAI Terms of Use](https://openai.com/policies/row-terms-of-use/) [U.S. Copyright Office AI Copyrightability Report](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf)

10. **Public repository and private vault must have a hard, automated boundary.** Recommended paths and controls:

    ```text
    # Public repository
    docs/art/style-bible.md
    docs/art/licensing-policy.md
    assets/public/cc0/                         # CC0 sources allowed only after manifest verification
    assets/public/original/                    # human-authored project-owned sources
    assets/manifests/assets.public.yaml
    tools/art/                                 # deterministic import/normalize/pack tools
    generated/public-atlases/                  # only CC0 or project-owned atlas output
    generated/atlas-metadata/                  # metadata safe for public release
    .gitignore                                 # blocks private mount and paid output

    # Separate private repository/object vault
    asset-vault/receipts/
    asset-vault/licenses/
    asset-vault/vendor/gds/<purchase-id>/source/
    asset-vault/vendor/craftpix/<purchase-id>/source/
    asset-vault/vendor/unity/<invoice-id>/source/
    asset-vault/ai/<generation-id>/input/
    asset-vault/ai/<generation-id>/output/
    asset-vault/ai/<generation-id>/provenance.yaml

    # CI workspace only — never committed to the public repository
    .private-assets/                           # temporary authenticated mount
    build/generated-paid-atlases/              # derived paid content
    build/release/                             # final game package
    ```

    Add exact deny rules for `.private-assets/`, `asset-vault/`, `build/generated-paid-atlases/`, vendor filename patterns, and common source formats where appropriate. CI should fail closed if private credentials are absent, and a release job—not a pull-request job from forks—should retrieve the paid family. A secret scanner cannot reliably recognize copyrighted pixels, so validate asset IDs and SHA-256 hashes against an allowlisted manifest before packing.

11. **Do not assume that “generated runtime atlas” means redistributable in source form.** A processed atlas made from paid sprites is still modified licensed art and is directly reusable if committed as a PNG plus coordinates. Keep paid-derived atlases out of the public Git history and ordinary CI artifacts. Put them only inside the actual game release package, containing the minimum used content and no unused vendor extras. The vendor licenses permit distribution of games/derivative works, not publication of a convenient replacement asset library. If this project distributes an open-source game whose runtime assets remain plainly reusable, obtain explicit written permission or ship a CC0-only public build with a locally injected “premium art” option.

12. **Adopt 64 px as the canonical logical tile profile and generate 32 px as an optional variant.** The project should not mix native 32 px and 64 px art ad hoc:
    - Canonical world tile: **64×64 px at 1×**.
    - Low-resolution/performance variant: **32×32 px**, deterministically derived from the approved 64 px master.
    - Pixel-art profile: nearest-neighbor scaling, integer coordinates, point filtering, no lossy texture compression, and generally no mipmaps.
    - HD/vector profile: render vectors at 128 px or higher working resolution, normalize to 64 px after the style pass, and use a consistent alpha-aware downsampler.
    - Large objects may occupy integer tile multiples, e.g. tank 2×3 tiles, truck 2×4, barracks 4×6.
    - Preserve an explicit per-sprite pivot and collision footprint; do not infer gameplay geometry from trimmed transparent bounds.

    CraftPix’s documented 128–256 px object sources and GameDeveloperStudio’s HD/vector sources give enough headroom for this normalization. The final choice between pixel and HD/vector style should be frozen before paid purchasing, because resampling alone will not make pixel-art and smooth vector art coherent.

13. **Use deterministic 2048×2048 atlases split by loading/use domain.** A single monolithic atlas causes unrelated content to load together; Unity’s own workflow guidance recommends splitting atlases according to common usage. Recommended groups:

    ```text
    atlas_terrain_<biome>_1x_00.png
    atlas_props_<biome>_1x_00.png
    atlas_units_<faction>_1x_00.png
    atlas_vehicles_<faction>_1x_00.png
    atlas_fx_common_1x_00.png
    atlas_ui_hud_1x_00.png
    ```

    Packing rules:
    - Maximum page: **2048×2048 RGBA**.
    - **4 px padding/extrusion** at 1×; use 2 px only for a tightly controlled point-filtered pixel-art atlas.
    - Deterministic lexical input ordering and stable packer version.
    - No 90-degree rotation for tiles, directional sprites, or animation frames.
    - Trim transparent edges only when the original untrimmed size, trim rectangle, and pivot are stored in metadata.
    - Premultiplied-alpha behavior must be consistent across the packer and renderer.
    - Separate terrain, units, vehicles, FX, and UI to avoid loading an entire 2048 page for one unrelated sprite.
    - Emit PNG plus JSON metadata and a manifest containing source hashes, page hashes, tool version, license class, and provenance ID.
    - CI must rebuild twice and compare hashes to establish reproducibility.

    Unity documents that atlases reduce draw calls, recommends splitting by common usage, and exposes a default four-pixel padding intended to prevent adjacent-sprite bleed. [Unity Sprite Atlas Workflow](https://docs.unity3d.com/2023.2/Documentation/Manual/SpriteAtlasWorkflow.html) [Unity Sprite Atlas Reference](https://docs.unity3d.com/Manual/sprite/atlas/sprite-atlas-reference.html)

14. **Define animation and direction contracts before importing store content.** Recommended baseline for a top-down military simulation:

    | Asset type | Required directions | Required states | Recommended frame budget |
    |---|---:|---|---:|
    | Infantry | 8 | idle, move, fire, reload, hit, death | idle 4; move 8; fire 4–6; reload 6–10; hit 2–3; death 8–12 |
    | Crew/support | 8 or mirrored 5-source/8-runtime | idle, move, use, death | 4–8 per state |
    | Wheeled/tracked vehicle | 16 rendered headings, or continuous rotation from components | idle/move, damaged, destroyed | body often static per heading; tracks/wheels 4–8 |
    | Turret | continuous rotation preferred | idle, fire | separate turret sprite; muzzle flash 4–6 |
    | Explosion/smoke | directionless | spawn, loop if applicable, dissipate | 8–16 |
    | Doors/barriers | directionless or 4 | closed, opening, open, closing | 4–8 transition frames |

    If a purchased family supplies fewer directions or frames, adapt through documented mirroring/component rotation rather than silently mixing unrelated art. Do not generate missing store-style frames with AI using the purchased frame as input unless the asset owner gives explicit written permission.

15. **Use one machine-parseable naming grammar.** Recommended source/runtime asset identifier:

    ```text
    <domain>_<class>_<variant>_<faction>_<state>_d<dir>_f<frame>_<scale>
    ```

    Examples:

    ```text
    unit_rifleman_mk01_blue_move_d03_f005_1x.png
    unit_medic_mk01_blue_death_d06_f009_1x.png
    veh_mbt_t72_green_idle_d11_f000_1x.png
    veh_turret_t72_green_fire_d11_f003_1x.png
    tile_ground_dirt_a_neutral_static_d00_f000_1x.png
    fx_explosion_he_common_burst_d00_f007_1x.png
    ```

    Rules:
    - Lowercase ASCII and underscores only.
    - Zero-pad direction and frame indices.
    - Directions are clockwise, with `d00 = north`; document whether angles use screen-space or world-space convention.
    - Never encode vendor names in runtime gameplay identifiers; vendor/source IDs belong in the provenance manifest.
    - Stable semantic IDs survive art replacement; atlas page and coordinates are generated properties, never embedded in game logic.

16. **Every asset needs a manifest entry before it can enter a build.** Minimum schema:

    ```yaml
    id: unit_rifleman_mk01_blue
    source_class: cc0 | owned-human | paid-gds | paid-craftpix | paid-unity | ai-assisted
    source_uri: vault://vendor/gds/purchase-id/path
    license_snapshot: vault://licenses/gds/YYYY-MM-DD.html
    receipt: vault://receipts/gds/order-id.pdf
    acquired_at: YYYY-MM-DD
    acquired_by: account-or-seat
    source_sha256: ...
    allowed_public_repo: false
    allowed_game_distribution: true
    allowed_ai_input: false
    ai_provider: null
    modifications:
      - normalized-palette
      - rerendered-64px
    reviewer: ...
    approved_at: YYYY-MM-DD
    ```

    The packer should refuse unknown `source_class` values and refuse to produce a public atlas if any input has `allowed_public_repo: false`.

17. **The style bible should be an enforceable acceptance specification, not a mood board.** `docs/art/style-bible.md` should freeze:
    - Camera: exact orthographic/top-down angle and whether roofs/vertical faces are visible.
    - Logical grid: 64 px canonical tile; optional 32 px derived profile.
    - Unit footprint and reference dimensions.
    - Eight- or sixteen-direction convention.
    - Palette: faction ramps, terrain ramps, outline colors, reserved UI/team colors.
    - Lighting: fixed light azimuth/elevation, shadow opacity/color/offset, ambient occlusion policy.
    - Rendering: pixel-art versus smooth-vector profile, antialiasing, outline width, texture/detail density.
    - Silhouette rules: infantry head/shoulder/weapon readability at gameplay zoom.
    - Vehicle decomposition: body, turret, weapon, wheels/tracks, shadow, damage overlay.
    - Animation cadence: target FPS per state and timing markers for muzzle/projectile/gameplay events.
    - Effects: explosion radius classes, smoke opacity, additive versus alpha blending.
    - Export: sRGB, straight or premultiplied alpha, trim/pivot policy, tile edge rules.
    - “Do not” page showing rejected mismatches.
    - Golden reference scene rendered at minimum, normal, and maximum supported zoom.

18. **Recommended staged adoption plan.**
    1. **Prototype now:** import only Kenney CC0 Top-down Tanks Remastered, Top-down Shooter, and relevant tower-defense/environment assets; record each pack URL, version, ZIP hash, and license snapshot.
    2. **Freeze style:** build one representative “golden scene” containing infantry, tank, road, dirt, foliage, building, muzzle flash, smoke, and UI marker.
    3. **Paid gate:** purchase the GameDeveloperStudio soldier/environment/vehicle/tank family only after the golden-scene review confirms the smooth/vector direction.
    4. **Private normalization:** render and palette-normalize paid source files in the private vault workspace.
    5. **Gap inventory:** list missing functional assets, then solve in order: kit recomposition, human illustration, commissioned art, and finally AI-assisted draft.
    6. **AI gate:** allow only text/internal/CC0 inputs, document provider terms and provenance, run similarity review, and require meaningful human editing.
    7. **Build:** emit category-split 2048 atlases and metadata. Public builds may contain only CC0/project-owned art; production release CI may inject paid art into the actual game package.
    8. **Audit:** before release, verify receipts, license snapshots, asset manifest, public-Git history, CI artifact retention, generated atlas composition, and third-party notices.

## Decision matrix

| Source | License/use | Public repo | AI input | Coherence | Resolution/editability | Indicative cost | Recommendation |
|---|---|---:|---:|---|---|---:|---|
| Kenney | CC0; commercial use and redistribution allowed | **Yes** | Legally much lower-risk under CC0, but still record provenance and provider terms | Medium across selected top-down packs; clean/cartoon rather than strict mil-sim | Large catalog; normalize supplied files to project profile | Free/donation | **Use immediately** |
| GameDeveloperStudio | Commercial, multi-project derivative works; no asset redistribution | **No** for source or reusable atlas | **No unless written permission** | **High**; one creator and extensive compatible catalog | HD PNG, SVG/vector, rigged/Spriter depending on pack | Approx. **$42.80** starter family | **Preferred paid family behind gate** |
| CraftPix | Commercial/unlimited projects; no source or reusable modified-art redistribution | **No** | **Explicitly prohibited** | High inside TDS Modern; less reliable across unrelated packs | PSD/PNG pixel sources; some vector packs at 128–256 px | Often **$5.50/pack**; approx. $27.50 for five packs | Viable alternative if pixel art is frozen |
| Unity Asset Store | Standard EULA varies by asset/provider; redistribution restrictions | Generally **No** | **Explicitly prohibited without express consent** | Variable; depends on publisher family | Variable | Variable | Avoid for this pipeline unless a uniquely necessary asset clears legal gate |
| AI-assisted original | Depends on model/provider, input rights, jurisdiction, and human authorship | Only after provenance and rights review | N/A; never feed blocked store art | Low initially; must be human normalized | Output is inconsistent; often needs redraw and animation cleanup | Variable usage plus substantial labor | Gap-fill only, not base family |

## Required repository controls

Add the following to the eventual `docs/research/05-asset-pipeline.md` implementation and CI policy:

```gitignore
# Never enter the public repository
.private-assets/
asset-vault/
build/generated-paid-atlases/
build/vendor-art/
*.psd
*.ai
*.eps
*.spriter
*.scml
```

The extension rules must be scoped if the project legitimately has public, project-owned PSD sources. More importantly, use pre-commit/CI manifest checks rather than relying only on extensions:

```text
FAIL if source_class is unknown.
FAIL if public build contains allowed_public_repo=false.
FAIL if an AI provenance record references allowed_ai_input=false.
FAIL if an input SHA-256 is absent from the approved manifest.
FAIL if a paid-derived atlas is created by a public/fork PR job.
FAIL if a release atlas contains an asset not used by the game.
FAIL if two clean builds produce different atlas or metadata hashes.
```

## Suggested issue #5 comment gist

> Research conclusion: start with Kenney’s CC0 Top-down Tanks Remastered/Top-down Shooter assets for prototypes and public-repo content. For production, gate one coherent paid GameDeveloperStudio military family—soldiers, environment, vehicles, and tanks, roughly $42.80 before discounts/tax—through a separate private vault and authenticated release CI. Never commit purchased sources or paid-derived runtime atlases to the public repository; those remain reusable art, while vendor licenses permit distribution in the game/derivative work rather than as an asset library.
>
> EULA blockers: Unity Asset Store terms prohibit store assets as AI/ML inputs without express consent, including use in the AI creation process. CraftPix expressly prohibits licensed assets and derivatives for training, testing, validation, or improvement of generative AI. Treat GameDeveloperStudio art as no-AI-input unless the author grants written permission. AI gap-fill may use text, internally authored sketches, or documented CC0 references only, followed by provenance capture, similarity review, and meaningful human editing.
>
> Pipeline: canonical 64 px tile, optional generated 32 px variant; deterministic category/faction/biome 2048×2048 atlases; 4 px padding/extrusion; stable naming and JSON metadata; separate pivots/collision footprints; private receipt/license/source vault; public manifest and packer; style bible covering camera, palette, lighting, directions, silhouettes, vehicle components, frame cadence, and export rules. Leave #5 open until the style profile is frozen, the paid family is approved/purchased, and CI proves that public builds cannot ingest restricted assets.

## Sources

### Kept

- [Kenney Support](https://kenney.nl/support) — Primary statement that asset-page content is CC0 and commercially usable.
- [Kenney Top-down Tanks Remastered](https://kenney.nl/assets/top-down-tanks-remastered) — Primary catalog page documenting 180 files and CC0.
- [Kenney Top-down Shooter](https://kenney.nl/assets/top-down-shooter) — Primary catalog page documenting 580 files and CC0.
- [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) — Authoritative license deed for CC0 permissions and limitations.
- [CraftPix File Licenses](https://craftpix.net/file-licenses/) — Primary license text covering commercial use, source redistribution, modified art, and the express AI prohibition.
- [CraftPix TDS Modern Pixel Game Kit](https://craftpix.net/product/tds-modern-pixel-game-kit/) — Primary description of the coherent military pixel family and included asset categories.
- [CraftPix Battle Location Tileset](https://craftpix.net/product/battle-location-top-down-2d-tileset-pack-2/) — Primary source for documented 128/256 px source resolutions and pricing.
- [GameDeveloperStudio License](https://www.gamedeveloperstudio.com/license.php) — Primary license text covering derivative works, commercial/multi-project use, contractors, and redistribution.
- [GameDeveloperStudio About](https://www.gamedeveloperstudio.com/about.php) — Primary coherence claim: a large catalog from one creator sharing a similar style.
- [GameDeveloperStudio Animated Soldiers](https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1m6c66581c5k030r3t&page-name=-op-down-animated-soldiers-game-character-pack) — Primary pack capabilities and price.
- [GameDeveloperStudio Military Environment](https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1c6q6h7o2f13692k3k&page-name=-op-down-military-environment-assets) — Primary environment scope, formats, and price.
- [GameDeveloperStudio Military Vehicles](https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1t6k6x8j0z0f5x3i7g&page-name=Top-down-military-vehicles) — Primary vehicle scope, formats, and indicative price.
- [GameDeveloperStudio Tank Assets](https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=116b6v5v419e9j0q3l&page-name=Top-down-tank-game-assets) — Primary tank component, format, and price information.
- [GameDeveloperStudio No AI Declaration](https://www.gamedeveloperstudio.com/no-ai.php) — Primary description of the catalog as human-created; retained to distinguish provenance from permission to use it as AI input.
- [Unity Asset Store Terms and EULA](https://unity.com/legal/as-terms) — Controlling primary EULA and express AI/ML-input restriction.
- [Unity AI Training Support Article](https://support.unity.com/hc/en-us/articles/16455448218516-Can-I-use-assets-to-train-AI-models) — Official operational clarification covering local models and third-party systems.
- [Unity Sprite Atlas Workflow](https://docs.unity3d.com/2023.2/Documentation/Manual/SpriteAtlasWorkflow.html) — Official guidance on common-use atlas grouping and loading implications.
- [Unity Sprite Atlas Reference](https://docs.unity3d.com/Manual/sprite/atlas/sprite-atlas-reference.html) — Official documentation for padding, tight packing, and maximum texture size.
- [U.S. Copyright Office AI Copyrightability Report](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf) — Primary government analysis of human authorship, prompting, and AI-output copyrightability.
- [OpenAI Terms of Use](https://openai.com/policies/row-terms-of-use/) — Example primary AI-provider terms showing output assignment does not remove the user’s responsibility for input rights.

### Dropped

- “Why Sprite Atlases Matter for Unity Mobile Games” — Dropped because it is an unsourced third-party marketing/blog benchmark; official Unity and Android guidance is sufficient.
- AppGameKit development tips — Dropped from the core recommendation because it is engine-specific and not necessary to justify the project’s chosen 2048 cap.
- General marketplace roundups and “best military asset” listicles — Dropped as SEO-heavy, potentially stale, and inferior to vendor catalog/license pages.
- Unity Asset Store user reviews and forum answers — Dropped because the controlling EULA and official support article directly answer the AI-input issue.
- CraftPix development-domain mirror pages — Dropped where production-domain primary product pages were available.
- GameDeveloperStudio educational-license page — Dropped from the core analysis because this project is distributing a game, not teaching materials.
- Adobe Firefly marketing FAQs — Dropped from the core provider recommendation because the project has not selected Firefly, and its plan-dependent indemnification has substantial exclusions.

## Gaps

- **Current checkout prices can change.** The quoted GameDeveloperStudio and CraftPix amounts are page prices observed during research; confirm currency, discounts, taxes, included formats, and license terms immediately before purchase.
- **No legal review was performed.** Vendor language such as “derivative work” and “intended use” can be fact-sensitive for an open-source game with extractable runtime textures. Obtain written vendor approval if paid-derived atlases will be included in a public source distribution rather than only a compiled game release.
- **GameDeveloperStudio has no express AI-input clause in the reviewed standard license.** The recommendation is intentionally conservative. A written response from the creator could resolve whether a particular local-only, non-training generative workflow is permissible.
- **The final renderer and target hardware were not established.** The 2048 cap, padding, compression, mipmapping, and 32 px variant should be validated on the actual engine and minimum target device.
- **Visual comparison was limited to vendor descriptions and preview/catalog evidence.** Before purchase, create a golden-scene bake-off using legally downloadable previews only for human evaluation—never as AI input—and verify camera angle, silhouette readability, weapon scale, shadow direction, and animation timing.
- **AI-provider terms are time-sensitive.** Select the provider only after recording the exact commercial-use, input-retention, model-training, confidentiality, output-rights, and indemnity terms applicable to the actual account tier.
- **Trademark and military insignia risks remain.** Review generated and purchased art for protected logos, unit insignia, flags, manufacturer marks, distinctive camouflage, and named real-world weapon branding.
- **GitHub implementation actions were not performed in this research-only run.** The parent implementation session still needs to create `research/asset-pipeline`, add `docs/research/05-asset-pipeline.md`, commit it, and post the supplied gist to issue #5 while leaving the issue open.

## Review findings

1. **blocker — `docs/research/05-asset-pipeline.md` / EULA policy:** Unity Asset Store assets must not enter any AI/ML input or creation pipeline without the required express consent; CraftPix content and derivatives are expressly barred from AI/ML training, testing, validation, and improvement.
2. **high — `.private-assets/`, `asset-vault/`, and `build/generated-paid-atlases/`:** Purchased source art and derived reusable atlases must not be committed to the public repository. Public release of an atlas plus metadata can function as prohibited asset redistribution even if the original PSD/SVG is absent.
3. **high — public CI configuration:** Fork/PR jobs must never receive vault credentials or produce/download paid atlases. Only a protected release job should inject paid art.
4. **high — asset manifest:** A build that accepts unclassified art can accidentally publish restricted material. Fail closed on missing license class, missing source hash, or `allowed_public_repo: false`.
5. **medium — `docs/art/style-bible.md`:** Purchasing before choosing pixel-art versus smooth/vector rendering risks incoherent content and costly rework. Freeze the golden scene and profile first.
6. **medium — AI provenance records:** Provider output ownership does not establish non-infringement or copyrightability. Require input-rights evidence, provider terms snapshot, generation metadata, similarity review, and meaningful human modification.
7. **medium — runtime atlas specification:** Trimming without original bounds and pivots will cause animation jitter and collision misalignment; preserve source size, trim rectangle, pivot, and footprint in metadata.
8. **no code blocker:** No application code was reviewed or modified in this research-only task.

## Residual risks

- Vendor EULAs and AI-provider terms may change after acquisition.
- Open-source distribution of extractable paid runtime art remains ambiguous without vendor-specific written approval.
- Purely AI-generated gap-fill may receive little or no U.S. copyright protection.
- AI outputs may resemble protected art, trademarks, real insignia, or branded equipment despite clean text-only inputs.
- A private vault reduces accidental redistribution but does not by itself satisfy seat, contractor, account, or publisher-specific license conditions.
- Mixing Kenney’s clean/cartoon presentation with GameDeveloperStudio’s HD/vector or CraftPix’s pixel family will remain visually inconsistent unless the style bible and normalization pass are enforced.
- Atlas size and animation budgets require profiling against the selected engine, memory budget, renderer, and minimum target device.
- Branch creation, repo documentation commit, and issue comment remain for the parent implementation session.