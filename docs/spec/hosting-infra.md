# Hosting & Infra Shape — Authoritative 20Hz Shards (Ticket #9)

**Map #1:** <https://github.com/BlockedPath/test2/issues/1> · **Ticket #9:** <https://github.com/BlockedPath/test2/issues/9> · **Depends on #3 (20Hz WS) + #4 (perf budget: 10–30 KB/s down, 1.05 TB/mo midpoint, ≤1ms tick, ~10MB/room)**
**Decision:** Start `Fly.io warm 1×` (or VPS) ≤25 rooms/vCPU, room = process shard, Redis only for multi-process, shard lifecycle `create → tick → drain → destroy`, region pinned, scale to 100, observability on tick/CPU/RSS/bytes.

## Recommendation for Spec

> **Infra:** Colyseus (Node `ws`) authoritative rooms, **one warm Machine per active geography** (`shared-1x/1GB` ≈ $5.92 + egress $0.02/GB NA/EU) with `min_machines_running=1`, **max 25 active rooms/vCPU until load-tested**, **1 GB RAM/process** (150 MB base + 10 MB/room). Serve PixiJS bundle from CDN/object storage, not game Machine. **After 10 always-occupied matches**, evaluate moving same container to dedicated VPS (e.g., Hetzner CX23 €5.49) if audience fits 1–2 regions; at 100 continuously-occupied matches: Fly ~$2,124/mo vs VPS ~€76 midpoint (40 TB incl + 65 TB excess @ €1/TB) — see `docs/research/04-perf-hosting.md` matrix.

Managed alternative: **Colyseus Cloud** ($15/mo floor, unlimited bandwidth advertised, 32 locations) — obtain CPU/quote + capacity guidance before 100-match budgeting; autoscaling currently manual per its FAQ.

Cloudflare Durable Objects **not** default — requires rewriting Colyseus to DO/WebSocket and at 20×20 msg/s request billing (~$1.2k/100 always-on) before engineering cost.

## Shard Lifecycle

```
Lobby → matchmaker creates Room (Colyseus) on warm process, reserves seat
Create → Room onCreate() → setSimulationInterval(50ms), load map state (50×50 tiles, 5 POIs), spawn scattered
Tick → 20Hz loop: consume inputs, simulate, delta-patch StateView to 10–20 clients, snapshot-interpolated on client (§3)
Drain → on `room.goingEmpty` or host disconnect, reject new joins, wait 5s, allow reconnects
Destroy → `onDispose()` → dispose room, free memory, emit metrics, GC check (no leak after soak)
Hibernate — NOT used for active 20Hz matches; DO hibernation only for idle lobbies. Fly autostop never stops a Machine owning reservable/active rooms.
```

Room stays on one process (Colyseus rule: room ↔ process). Horizontal scale = more processes, not splitting a match.

## Region Strategy

- **Start:** 1 warm region = primary audience (e.g., `iad` or `fra`), `min_machines_running=1` there. Broad region creation on demand.
- **Expansion:** Add 2nd region when p95 join RTT >80ms for 10% players. Keep room + clients in same region — do not cross-region tick.
- **Fallback:** Design fallback if Fly placement fails (regional capacity per Fly docs) — retry client to secondary region, do not create cross-region room.
- **Single-region VPS** is cheapest only if audience fits 1–2 regions; otherwise Fly/Cloud edge wins on latency.

## Horizontal Scale to ~100 Concurrent Matches

- **Density guardrail:** ≤25 rooms/vCPU (1ms avg tick × 20 × 25 = 500ms CPU/s → 50% headroom). Scale to 100 = 4 vCPU floor (e.g., 4× 1GB Machines or 2× CSP-4×). Measure actual p99 room tick ≤2.5ms and aggregate ≤25ms p95 before raising density.
- **Autoscaling:** Do not use blind CPU autoscale. Use **room-aware scaling**: metrics `activeRooms`, `cpu%`, `eventLoop p99`, `missedTicks`, `rss%`. Drain rooms before stopping a Machine. Fly `autostop/autostart` only over existing Machines — need Machines API or metric autoscaler to create capacity.
- **Redis:** Single process needs no Redis. At ≥2 processes/servers, enable Colyseus presence/driver (`@colyseus/redis-driver` + `@colyseus/redis-presence`) for matchmaker discovery and inter-process messaging.

## Minimal Observability (must alert/block release)

- **Tick:** room simulation+encode avg ≤1ms, p99 ≤2.5ms; process aggregate tick p95 ≤25ms; missed-tick rate ≤0.1%
- **CPU:** process >60% sustained → warn, >75% → scale, event-loop p99 ≤20ms
- **Memory:** ≤10 MB/room incremental, ≤0.5 MB/player, ≤150 MB base; process RSS >70% → scale; fail if growth after soak
- **Network:** per-player downstream 10–30 KB/s (alert 20 KB/s p95, block 30), upstream 0.3–1 KB/s; match egress 0.72–2.16 GB/hr (mid 1.44); WebSocket queued bytes capped, disconnect slow consumers
- **Game:** join latency, reconnect success, room-disposal latency, activeRooms, player count, zone phase timings
- **Infra:** Machine restart/placement failures, TLS cert renew, Redis latency

Ship metrics to chosen stack (e.g., Fly Prometheus/Grafana, or cheap VPS `node_exporter` + `promtail` + Loki) — not in tick.

## Operational Checklist (human provisions)

**Deploy:**

- [ ] `Dockerfile` Node 20 + `pnpm` + Colyseus server + `ws`/`uWS`, health endpoint `/healthz`
- [ ] `fly.toml`: `app=...`, `primary_region=iad`, `min_machines_running=1`, Machine size `shared-1x` 1GB start, `auto_stop_machines=false` for active-room Machines
- [ ] Secrets: Redis URL (when multi-process), `PORT`, `NODE_ENV`
- [ ] Static assets: PixiJS build to R2/S3 + CDN (Cloudflare R2 + Workers) — game Machine serves only WS + `/healthz`
- [ ] TLS: Fly auto-TLS or VPS Caddy/Let's Encrypt, wss only

**Provision:**

- [ ] Fly: `fly apps create`, `fly redis create` (if multi), `fly volumes` not needed for stateless rooms, `fly deploy --strategy rolling`
- [ ] VPS alternative: Hetzner CX23 (2 vCPU/4GB €5.49), `ufw`, `Caddy`, `pm2` or `systemd`, Redis `valkey`, log rotation
- [ ] DNS: `game.<domain>` → Fly Anycast or VPS IP, CDN CNAME for assets

**Run:**

- [ ] Load-test with representative bot (move/aim/shoot/damage per §4 validation) at 1/10/25/50/100 rooms ×20 clients; record SLOs above before raising 25/vCPU
- [ ] Soak 8–12h churn to catch leaks after room disposal
- [ ] Thermals: 10-min worst-case (20 visible, FX, FOV) on iPhone/Android/desktop, frame p95 ≤12ms mobile / ≤8ms desktop

**Failover & scale:**

- [ ] Graceful drain: on SIGTERM, `room.disconnect()` new joins, wait, then exit
- [ ] Capacity controller: scale Machines based on `activeRooms` + CPU, not just CPU
- [ ] Budget: start Fly <$20 for <10 always-on; re-evaluate at ~10 per #4 matrix; VPS after measurement if 1–2 regions suffices

## What This Unlocks

Spec is now **way clear** — 8/8 wayfinder decisions closed (netcode, engine, loop, controls, map, perf, assets, infra). Fog items `Lobby & matchmaking flow`, `Sound & VFX`, `Playtest plan` can now graduate into build tickets (not wayfinding) — lobby is next logical build slice.

*Artifact on `main` at `docs/spec/hosting-infra.md` (this file). Closes #9.*
