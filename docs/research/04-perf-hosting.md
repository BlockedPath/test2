# Research: Browser performance and hosting budget for 20-player authoritative matches

## Summary

A 10–20-player top-down authoritative match at a 20 Hz simulation rate is comfortably feasible with PixiJS and Colyseus/WebSockets, provided the implementation uses compact binary/delta snapshots, preserves PixiJS batching, and keeps the authoritative hot path allocation-free. The proposed planning envelope is **10–30 KB/s downstream and 0.3–1 KB/s upstream per player**, **≤1 ms average CPU per room tick**, **≤50 mobile / ≤100 desktop draw calls**, and approximately **10 MB incremental server memory per active room**.

For the selected Colyseus stack, begin with **one warm regional Node process on Fly.io or a conventional VPS** and load-test before increasing density beyond 25 simultaneous matches per vCPU. A bandwidth-heavy 20 Hz all-to-all replication model makes Fly.io surprisingly expensive at sustained high occupancy because compute is cheap but egress is metered; a high-transfer VPS or Colyseus Cloud’s advertised unlimited bandwidth becomes more attractive. Cloudflare Durable Objects can scale per match and eliminate egress fees, but they are **not a drop-in Colyseus host** and 20-player × 20 Hz incoming WebSocket messages create substantial request charges.

## Findings

1. **The 50 ms tick interval is not the usable CPU budget.** A 20 Hz simulation technically has 50 ms between ticks, but using that entire interval would leave no capacity for serialization, WebSocket writes, garbage collection, matchmaking, or other rooms. A safe initial guardrail is **≤1 ms average and ≤2.5 ms p99 simulation-plus-encoding time per room per tick**, with each process’s aggregate tick phase **≤25 ms p95** and event-loop delay **≤20 ms p99**. At 25 rooms per vCPU, 1 ms × 20 ticks × 25 rooms is approximately 500 ms of CPU per second, leaving roughly 50% headroom. This is a planning model, not a measured result. Colyseus explicitly says capacity depends on game-loop complexity, room state, and patch frequency, and recommends profiling and application-specific load testing. [Colyseus FAQ](https://docs.colyseus.io/faq) [Colyseus load testing](https://docs.colyseus.io/tools/loadtest)

2. **A practical per-player network envelope is 10–30 KB/s down and 0.3–1 KB/s up.** A compact player record of 16–32 bytes produces 320–640 bytes for 20 players. Allowing for projectiles, changed environmental state, events, schema/framing overhead, and occasional keyframes yields approximately **0.5–1.5 KB per snapshot**. At 20 snapshots/second that is **10–30 KB/s downstream per player**. Inputs containing sequence, buttons, aim, and movement can fit in approximately 12–32 payload bytes; at 10–20 Hz, WebSocket framing and transport overhead bring the planning figure to **0.3–1 KB/s upstream**. Use these as guardrails rather than promises because Colyseus patches depend on the actual schema and mutations. Colyseus recommends reducing state size, increasing patch interval when possible, and using `StateView` to limit per-client visibility. [Colyseus FAQ](https://docs.colyseus.io/faq)

3. **The server egress multiplier is the dominant hosting-cost risk.** At 20 players, 10–30 KB/s downstream per player is **200–600 KB/s of match egress**, or approximately **0.72–2.16 GB per match-hour**. A continuously occupied match therefore emits approximately **0.53–1.58 TB/month** over 730 hours; the midpoint used in the cost matrix is **1.05 TB per match-month**. This excludes static assets, retransmission effects below TCP, matchmaking traffic, logs, database traffic, and inter-region coordination. The budget should alert at **20 KB/s/player rolling p95** and block release if typical play exceeds **30 KB/s/player**.

4. **Separate the simulation rate from the replication rate if bandwidth exceeds the guardrail.** Keep authoritative movement and collision at 20 Hz, but sending entity deltas at 10–15 Hz with interpolation is an acceptable first lever if 20 Hz replication exceeds 30 KB/s/player. Inputs can also be sent only when controls change, with a periodic 10–20 Hz refresh. Do not reduce authority or move hit resolution to the client merely to save server CPU.

5. **PixiJS should batch this scene efficiently, but batching must be treated as a measurable budget.** PixiJS documentation recommends spritesheets, grouping similar renderable types and blend modes, avoiding frequently modified complex `Graphics`, using bitmap text for changing text, and reducing texture resolution on older mobile devices. PixiJS notes that interleaving sprite/graphics or blend modes breaks batches, while sprites can batch across up to 16 textures depending on hardware. [PixiJS performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips)

6. **Recommended render guardrails are deliberately below plausible engine ceilings.** These are internal release thresholds, not PixiJS guarantees:

   | Metric | Mobile guardrail | Desktop guardrail | Failure action |
   |---|---:|---:|---|
   | Target frame rate | 60 FPS; allow a tested 30 FPS quality tier | 60 FPS | Lower resolution/effects before lowering gameplay tick |
   | Main-thread frame time, gameplay p95 | ≤12 ms | ≤8 ms | Profile scripting, object churn, text, and event hit testing |
   | Long frames | <1% above 33 ms | <0.5% above 33 ms | Treat repeated spikes as release blocker |
   | Draw calls, normal gameplay p95 | ≤50 | ≤100 | Reorder scene, atlas textures, remove blend/filter batch breaks |
   | Visible renderables | ≤1,500 | ≤3,000 | Cull off-screen/occluded objects and pool effects |
   | Dynamic lights/filters | ≤2 full-screen-equivalent passes | ≤4 | Replace with baked/sprite lighting or reduce filter area |
   | Renderer resolution | 1–1.5; cap device-pixel-ratio at 1.5 | 1–2; cap at 2 | Dynamic resolution tier |
   | Atlas edge | Prefer ≤2048; hard compatibility cap 4096 | Prefer ≤4096 | Split larger atlases |
   | JS heap during match | ≤128 MB | ≤256 MB | Heap snapshot; remove retained scenes/listeners |
   | Estimated GPU texture residency | ≤128 MB | ≤256 MB | Lower-resolution atlases; unload unused sources |

   PixiJS’s official recommendations support the mitigation choices, but no official PixiJS documentation guarantees a particular draw-call, sprite, or memory ceiling. [PixiJS performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips)

7. **High-DPI rendering is the clearest mobile/desktop variance multiplier.** Moving from renderer resolution 1 to 2 quadruples the rendered pixel count and the memory used by resolution-dependent render targets. A 2048×2048 RGBA8 atlas occupies approximately 16 MiB before mipmaps and about 21.3 MiB with a full mip chain; several atlases, filters, and render textures can consume the mobile GPU budget quickly. Default mobile to an opaque background, no antialiasing, resolution ≤1.5, and reduced effects; permit higher quality only after measuring stable frame time on target devices. PixiJS specifically notes that older mobile devices are slower and recommends opaque rendering, disabling antialiasing, and lower-resolution textures. [PixiJS performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips)

8. **Thermal and browser variance require sustained tests, not a brief desktop trace.** Mobile acceptance should include at least one recent iPhone/Safari, one recent mid-range Android/Chrome device, and one older or low-end Android device. Run a **10-minute worst-case match**, because an 8–10 minute game can expose thermal throttling and memory-pressure termination that a 30-second trace will not. Record frame-time percentiles rather than average FPS. Desktop testing should cover current Chrome, Firefox, and Safari where available.

9. **Server memory should be budgeted incrementally per room, not inferred from connection count alone.** Colyseus says a typical connection consumes approximately 2–5 KB, but also warns that room state increases memory use. That socket baseline is small; retained state, spatial indices, snapshot buffers, replay/event history, closures, and queued outbound data will dominate. Use **≤10 MB incremental RSS/heap per 20-player room**, **≤0.5 MB per player**, and **≤150 MB process baseline** as initial release thresholds. At 25 rooms, that models roughly 400 MB before safety margin; provision at least **1 GB per production process**. Fail a soak test if memory continues increasing after repeated room creation and disposal. [Colyseus FAQ](https://docs.colyseus.io/faq)

10. **Colyseus rooms scale horizontally by process, but a room stays attached to one process.** Colyseus documents that each room belongs to one process, clients connect directly to the room’s process, and Redis-backed presence/driver infrastructure is needed when scaling across processes or servers. This makes a 20-player room a natural shard, but autoscaling must preserve routing and avoid terminating processes that still own rooms. [Colyseus scalability documentation](https://docs.colyseus.io/scalability)

## Performance budget matrix

| Layer | Budget for a 20-player match | Warning threshold | Release blocker |
|---|---:|---:|---:|
| Authoritative tick | 20 Hz / 50 ms interval | Room tick p99 >2.5 ms | Aggregate process tick p95 >25 ms or missed-tick rate >0.1% |
| Room CPU | ≤1 ms average simulation + encode | >1 ms average | >2 ms average under representative bots |
| Process density | Start at ≤25 rooms/vCPU | CPU >60% sustained | CPU >75%, event-loop p99 >20 ms, or missed ticks |
| Player downstream | 10–30 KB/s | Rolling p95 >20 KB/s | Typical representative match >30 KB/s |
| Player upstream | 0.3–1 KB/s | >1 KB/s | Unbounded input/message rate |
| Match egress | 0.72–2.16 GB/hour | >1.44 GB/hour midpoint | >2.16 GB/hour |
| Room memory | ≤10 MB incremental | >10 MB after steady state | Growth after room disposal/soak or >20 MB |
| Process memory | ≤150 MB base + room budget | RSS >70% limit | OOM/restarts or >80% limit |
| Mobile draw calls | ≤50 p95 | 51–75 | >75 in normal gameplay |
| Desktop draw calls | ≤100 p95 | 101–150 | >150 in normal gameplay |
| Mobile JS heap | ≤128 MB | 128–160 MB | Sustained >160 MB or termination |
| Desktop JS heap | ≤256 MB | 256–384 MB | Sustained >384 MB |
| Mobile texture residency estimate | ≤128 MB | 128–192 MB | >192 MB on baseline content |
| Desktop texture residency estimate | ≤256 MB | 256–384 MB | >384 MB |
| Client long frames | <1% mobile / <0.5% desktop above 33 ms | Threshold exceeded | Recurrent >100 ms gameplay stalls |

## Hosting assumptions

The following matrix models **0, 10, and 100 simultaneous matches occupied continuously for 730 hours/month**. It uses:

- 20 players per match.
- 20 Hz input and replication.
- 20 KB/s downstream/player midpoint.
- Approximately **1.05 TB egress per continuously occupied match-month**.
- A conservative starting density of **25 matches/vCPU**.
- At least 1 GB RAM per production Node process.
- Prices in provider-listed currency, excluding tax, support, managed Redis/database, observability, backups, static asset delivery, and engineering/operations labor.
- Costs are planning estimates, not quotes.

Real games rarely remain at peak concurrency for every hour. To estimate from match-hours instead, multiply active match-hours by approximately **1.44 GB egress/match-hour** at the midpoint.

## Hosting decision matrix

| Host | Colyseus compatibility | Cold start / readiness | Region model | Autoscaling | 0 matches | 10 matches, continuously occupied | 100 matches, continuously occupied | Assessment |
|---|---|---|---|---|---:|---:|---:|---|
| **Fly.io Machines** | Native Node container; Redis still needed for multi-process discovery | Machines can auto-start on traffic and stop/suspend when idle. Fly advertises millisecond-class Machine wake-up, but application boot, image, health check, and seat-reservation races must be measured. Keep one warm Machine per active player geography for production. | Broad explicit region selection; regional capacity can fail placement and fallback must be designed. | Autostop/start starts existing Machines; it does not create unlimited capacity unless the metrics autoscaler or Machines API is used. Drain rooms before stopping. | Approximately $0 compute when stopped, plus root filesystem at $0.15/GB-month and any certificates/storage | Approximately **$216/month**: shared-1x/1 GB about $5.92 plus ~10.5 TB NA/EU egress × $0.02/GB ≈ $210 | Approximately **$2,124/month**: shared-4x/4 GB about $23.66 plus ~105 TB egress × $0.02/GB ≈ $2,100 | Best developer-controlled regional pilot, but sustained snapshots make metered egress the dominant cost. Reduce replication bandwidth or negotiate/choose another host before 100 always-on matches. |
| **Cloudflare Workers + Durable Objects** | **Not a drop-in Colyseus deployment.** Requires a custom Durable Object/WebSocket room implementation and protocol adaptation. | Object is created/woken on demand near its selected placement. Hibernation reconstructs in-memory state, but an actively ticking 20 Hz match cannot rely on hibernation. | Object is initially placed near the first access or via a broad location hint and does not currently migrate after creation. Some hints fall back to another area. | Elastic object creation; one object per room is natural. No VM capacity management. | **$5/month** Workers Paid minimum | Approximately **$119/month**: $5 minimum + ~$36.5 duration + ~$77.6 incoming-message requests | Approximately **$1,192/month**: $5 + ~$409.7 duration + ~$777.5 incoming-message requests | Attractive elastic room primitive and no egress charge, but incompatible with the selected Colyseus server architecture without a rewrite. At 20 clients × 20 inputs/s, request billing dominates. Event-driven inputs could lower cost substantially. |
| **Bare VPS / cloud VM, represented by Hetzner EU CX23-class shared server** | Native Node/Colyseus; team owns TLS, process manager, Redis, firewall, monitoring, deploys, failover, and draining | No match cold start while server is running. Provisioning/recovery is slower and operationally owned. | Far fewer practical game regions than edge/serverless providers; players far from the chosen region incur latency. | No built-in room-aware autoscaling. Implement capacity controller/load balancer or scale manually. | $0 if deleted; approximately **€5.49/month** to keep one warm 2-vCPU/4-GB server, plus IPv4 if required | Approximately **€5.49/month** in EU because ~10.5 TB is within the advertised 20 TB transfer allowance | Approximately **€76/month midpoint**: two servers ≈ €10.98, 40 TB included, ~65 TB excess × €1/TB. Modeled range is roughly €24–€129 as bandwidth varies from 10–30 KB/s/player | Lowest raw cost and most predictable latency when the audience fits one or two regions. Highest operations burden and weakest scale-to-zero story. Shared CPU needs load/steal-time validation; dedicated CPU is safer for production. |
| **Colyseus Cloud** | Best native compatibility; managed deployment, SSL, monitoring, and Colyseus-specific operations | Provisioned subscription rather than per-match serverless wake. No documented match cold-start concern while the instance is running. | Advertises 32 locations. | Product page says horizontal/vertical scaling, but its FAQ says automatic scaling is **not currently available** and resources must be upgraded manually. | **$15/month minimum** while provisioned; cancellation receives unused-time credit under documented billing terms | **≥$15/month**, subject to entry-plan capacity | A defensible public quote is unavailable. A rough floor is **≥$60/month** only if four entry-class vCPUs can be provisioned at $15 each and each sustains 25 matches; this assumption is not published and must not be treated as a quote | Strongest low-ops fit for the chosen stack and advertised unlimited bandwidth. Request an actual plan quote and load-test result before budgeting 100 matches. The lack of current autoscaling means capacity planning remains manual. |

### Hosting calculation notes

- Fly.io’s current public table lists a shared 1× CPU Machine with 1 GB RAM around $5.92/month and a shared 4× CPU Machine with 4 GB around $23.66/month in the base table; regional prices vary. NA/EU public internet egress is $0.02/GB. Fly bills running Machines per second and stopped root filesystems at $0.15/GB-month. [Fly.io pricing](https://fly.io/docs/about/pricing/)
- Fly Proxy autostart can start a stopped Machine, but normal autostop/autostart operates over Machines already created. `min_machines_running` only maintains the minimum in the primary region, so a multi-region warm floor needs separate management. [Fly.io autostop/autostart](https://fly.io/docs/launch/autostop-autostart/)
- Fly warns that regional capacity can prevent placement and that flexible fallback does not apply uniformly to all `scale`, `deploy`, and `launch` operations. [Fly.io regional placement](https://fly.io/docs/machines/guides-examples/machine-placement/)
- Cloudflare bills each active Durable Object as though it has 128 MB allocated. The paid plan includes 400,000 GB-s/month, then charges $12.50/million GB-s. Incoming WebSocket messages receive a 20:1 billing ratio; outgoing WebSocket messages are free. At 20 players × 20 messages/s, each match produces 400 incoming messages/s, or 20 billable requests/s after the ratio. [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- Cloudflare’s hibernation API is useful for idle chat/lobby sockets, but a match emitting an authoritative tick every 50 ms is active work. Standard `accept()` also incurs duration for the entire connection, while hibernation reconstructs in-memory state when awakened. [Durable Objects WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- Durable Object location hints are broad, only the first `get()` respects the hint, and objects do not currently move after creation. [Durable Objects data location](https://developers.cloudflare.com/durable-objects/reference/data-location/)
- Hetzner advertises the CX23 at €5.49/month in its current international cloud listing, 20 TB included transfer for EU cloud servers, and €1/TB excess transfer. Availability, taxes, IPv4, region, and plan pricing must be rechecked at purchase time. [Hetzner Cloud](https://www.hetzner.com/cloud/?country=ot%2F) [Hetzner traffic documentation](https://docs.hetzner.com/robot/general/traffic/)
- Colyseus Cloud publicly advertises starting at $15/month, unlimited bandwidth, no CCU/DAU/MAU limit, and 32 locations. Its FAQ says autoscaling is not currently available and recommends application-specific load testing rather than relying on the pricing simulator’s capacity estimate. [Colyseus Cloud](https://colyseus.io/cloud-managed-hosting/) [Colyseus pricing](https://colyseus.io/pricing/) [Colyseus Cloud billing](https://docs.colyseus.io/cloud/pricing-billing)

## Recommendation

### Default for the prototype and initial production

Use **one warm Fly.io Machine in the primary audience region**, running the selected Colyseus server, with these limits:

- 1 shared or performance vCPU and at least 1 GB RAM.
- Maximum 25 active rooms until load testing demonstrates more.
- `min_machines_running = 1` in the primary region.
- Do not let Fly autostop a process with active or reservable rooms.
- Add room-aware draining before enabling scale-down.
- Use Redis presence/driver only when adding another process or server.
- Alert on event-loop delay, missed ticks, active rooms, room tick percentiles, process RSS, outbound bytes/player, and WebSocket backpressure.
- Serve static PixiJS assets from object storage/CDN rather than the game-server Machine.

Fly is not the cheapest at steady high load, but it gives a low-operations route to validate the actual CPU and bandwidth model. It should be reconsidered when sustained usage exceeds approximately **10 always-occupied matches** unless observed bandwidth is materially below the 20 KB/s/player midpoint.

### Cost-optimized production after measurements

If the game validates and its audience can be served from one or two regions:

1. Move the same Colyseus container to a **dedicated-CPU or well-observed VPS with a high transfer allowance**.
2. Keep at least two processes/instances across failure domains if availability matters.
3. Implement Redis-backed Colyseus presence/driver and room-aware routing/draining.
4. Purchase capacity based on measured p99 room tick time and measured transfer, not the nominal connection count.
5. Prefer dedicated CPU once shared-host steal/jitter threatens the tick SLO.

This is likely the lowest-cost option at 100 concurrent matches. The cost advantage should be weighed against the engineering and on-call burden.

### Managed alternative

Use **Colyseus Cloud** if eliminating deployment, TLS, monitoring, and basic infrastructure work is worth more than minimizing the raw server bill. Its advertised unlimited bandwidth is unusually valuable for this replication pattern. Before choosing it, obtain:

- Exact CPU/RAM plan and monthly quote for 10 and 100 matches.
- Confirmation of bandwidth policy and any fair-use restrictions.
- Capacity/load-test guidance for a 20 Hz room.
- Region failover behavior.
- Manual scaling lead time and connection-draining procedure.

### Not recommended as the default

Do not select Cloudflare Durable Objects solely because they autoscale and have no egress fee. They require replacing the selected Colyseus runtime with a Durable Object-specific room implementation. At 20 Hz per-player input, incoming-message request billing is substantial; at 100 constantly occupied matches the modeled total is around $1.2k/month even before engineering cost. Durable Objects become more attractive if input is truly event-driven or much lower-frequency and the team intentionally chooses a Cloudflare-native architecture.

## Required validation plan

1. **Create a representative bot.** It must join, move, aim, shoot, spawn projectiles, take damage, encounter other players, and exercise schema mutations at realistic frequency. Idle sockets are not a valid load test.

2. **Test room-count steps.** Run 1, 10, 25, 50, and 100 rooms with 20 clients each. Distribute load generators away from the server and ensure they are not CPU-bound.

3. **Measure server metrics.**
   - Room simulation time: average, p95, p99, maximum.
   - State encoding/patch generation time separately from simulation.
   - WebSocket send time and backpressure/queued bytes.
   - Node event-loop delay.
   - Process CPU, RSS, heap used, GC pause time, and allocation rate.
   - Missed or late ticks.
   - Bytes in/out per player and per room.
   - Join latency, reconnect success, and room-disposal latency.

4. **Run three phases.**
   - 15-minute ramp to identify the knee.
   - 60-minute steady-state capacity run.
   - 8–12-hour room churn/soak test to detect retained room state and reconnection leaks.

5. **Determine process capacity by SLO, not by failure.** The safe room count is the lowest capacity where any of these occurs:
   - Process CPU reaches 60% sustained.
   - Aggregate tick phase reaches 25 ms p95.
   - Room tick reaches 2.5 ms p99.
   - Event-loop delay reaches 20 ms p99.
   - Missed ticks exceed 0.1%.
   - RSS exceeds 70% of the process/container limit.
   - Representative player downstream exceeds 30 KB/s.

6. **Test browser worst cases.**
   - 20 visible players.
   - Peak projectile and particle count.
   - Maximum foliage/buildings in view.
   - FOV/lighting enabled.
   - HUD, minimap, changing labels, inventory, and damage effects active.
   - 10 continuous minutes on each baseline mobile device.
   - Record p50/p95/p99 frame times, draw calls, renderable count, JS heap, texture estimate, and long-frame count.

7. **Repeat hosting calculations with measured values.** Replace the 1.05 TB/match-month midpoint with:

   `measured downstream bytes/second/player × players/match × active match-hours`

   Add provider-specific egress, request, Redis, load-balancer, IP, support, and observability costs.

## Guardrails for the product specification

- Authoritative simulation: **20 Hz**.
- Snapshot delivery: begin at **20 Hz delta patches**; allow **10–15 Hz replication with interpolation** if bandwidth exceeds the budget.
- Client input: send on change plus bounded refresh; server rate-limit to **≤20 gameplay messages/s/player**, with separate limits for chat/lobby.
- Never send JSON full-world snapshots during gameplay.
- Quantize positions, angles, velocities, and timestamps where game precision allows.
- Use area-of-interest/state visibility if the whole small map does not need to be visible.
- Cap WebSocket queued bytes and disconnect persistently slow consumers.
- No synchronous disk/database/network work in the authoritative tick.
- Pool high-churn entities and avoid per-tick temporary object graphs.
- Preserve one-room/one-process authority; shard by room rather than attempting to split a match across cores.
- Keep one warm server in any production matchmaking region.
- Do not terminate a process until its rooms have completed or migrated by an explicitly tested mechanism.
- Make mobile quality defaults conservative: opaque background, antialias off, renderer resolution ≤1.5, limited full-screen filters, lower-resolution textures.
- Treat draw calls, bytes/player, room tick time, and incremental room memory as CI/performance-test outputs.
- Re-run the capacity suite after changes to collision, projectile count, map geometry, serialization schema, visibility, effects, or dependency versions.

## Sources

### Kept

- [Colyseus FAQ](https://docs.colyseus.io/faq) — Primary documentation for patch rate, connection-memory baseline, performance factors, and load-test requirement.
- [Colyseus scalability](https://docs.colyseus.io/scalability) — Primary documentation for room/process ownership, direct client routing, Redis presence/driver, and multi-process topology.
- [Colyseus load testing](https://docs.colyseus.io/tools/loadtest) — Official tool and workflow for representative simulated clients.
- [PixiJS performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips) — Official guidance on batching, spritesheets, mobile settings, graphics, text, culling, and texture lifecycle.
- [Fly.io resource pricing](https://fly.io/docs/about/pricing/) — Primary compute, stopped-rootfs, and regional egress prices.
- [Fly.io autostop/autostart](https://fly.io/docs/launch/autostop-autostart/) — Primary explanation of warm minimums and the distinction between starting existing Machines and creating capacity.
- [Fly.io machine placement](https://fly.io/docs/machines/guides-examples/machine-placement/) — Primary source for regional placement and capacity caveats.
- [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) — Primary request, duration, 128 MB allocation, and WebSocket billing rules.
- [Cloudflare Durable Object WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) — Primary description of hibernation behavior and in-memory reconstruction.
- [Cloudflare Durable Object limits](https://developers.cloudflare.com/durable-objects/platform/limits/) — Primary runtime and WebSocket limits.
- [Cloudflare Durable Object data location](https://developers.cloudflare.com/durable-objects/reference/data-location/) — Primary location-hint, placement, and migration caveats.
- [Hetzner Cloud](https://www.hetzner.com/cloud/?country=ot%2F) — Current vendor plan listing used for the representative VPS compute price.
- [Hetzner traffic documentation](https://docs.hetzner.com/robot/general/traffic/) — Primary transfer allowance and excess-traffic information.
- [Colyseus Cloud managed hosting](https://colyseus.io/cloud-managed-hosting/) — Vendor source for regions, bandwidth, and current autoscaling statement.
- [Colyseus pricing](https://colyseus.io/pricing/) — Vendor source for the $15/month public starting price and unlimited bandwidth claim.
- [Colyseus Cloud pricing and billing](https://docs.colyseus.io/cloud/pricing-billing) — Primary subscription, proration, and credit behavior.

### Dropped

- Grow or Die “1,000 players per CPU core” architecture article — useful practical anecdote about compact binary snapshots, but the simulation, transport implementation, and workload differ too much to use as a capacity guarantee.
- Stack Overflow and GameDev Stack Exchange performance threads — old, workload-specific, and not authoritative enough for numeric budget claims.
- Third-party WebSocket/Socket.IO benchmarks — transport microbenchmarks do not represent Colyseus schema encoding, the proposed collision system, or room churn.
- SEO comparison and hosting-review pages — redundant with provider documentation and often omit transfer/request pricing details.
- Deprecated Hetzner CX22 plan documentation — replaced by the vendor’s current CX23 listing.
- Colyseus pricing-simulator capacity estimate — the vendor itself cautions that it is not a substitute for application-specific load testing, and the accessible public pages do not expose enough exact plan detail for a reliable 100-match quote.

## Gaps

- **High residual risk — server figures are modeled, not benchmarked.** The repository ticket specifies the intended architecture but provides no representative game loop, collision implementation, schema, projectile density, or load-test result. CPU/tick and matches/vCPU cannot be stated confidently until a bot-driven benchmark exists.
- **High residual risk — network figures depend on schema design.** Colyseus delta size must be captured from representative combat. Full snapshots, JSON payloads, frequent create/remove churn, or per-client filtered patches can move CPU and bandwidth materially.
- **High residual risk — Cloudflare is an architectural comparison, not a deploy target for the chosen server.** Exact rewrite effort and behavior of a continuously ticking Durable Object need a proof of concept.
- **Medium residual risk — Colyseus Cloud lacks a sufficiently detailed public quote.** The public floor is $15/month, but exact CPU/RAM plan prices and capacity for 100 matches require the provider dashboard or a sales quote.
- **Medium residual risk — browser memory ceilings are not standardized.** The proposed mobile/desktop limits are conservative project guardrails, not browser guarantees. iOS termination behavior varies by device, OS version, thermal state, and competing applications.
- **Medium residual risk — VPS price and transfer geography vary.** The representative Hetzner estimate assumes EU transfer allowances and pricing; US and Asia allowances differ, and a single EU region may not meet player-latency requirements.
- **Medium residual risk — occupancy assumption is intentionally severe.** “100 concurrent matches” modeled continuously for all 730 hours is a capacity ceiling, not a likely early-stage monthly usage curve. Actual cost should be calculated from match-hours and regional peak concurrency.
- **Operational work not performed in this research-only artifact.** No repository branch, product documentation file, Git commit, or GitHub issue comment was created. The runtime output-path override required the completed artifact at `/Users/justin/Developer/test2/.pi-subagents/artifacts/outputs/b6d63798/research.md`; the parent should persist or adapt it to `docs/research/04-perf-hosting.md`, create `research/perf-hosting`, commit it, and comment a concise gist on issue #4 while leaving the issue open.