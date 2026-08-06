# test2 — Realistic Top-Down Battle Royale

This repository contains a browser-only, realistic top-down battle royale scaffold.

## Current implementation slice: ticket #11

The first implementation slice is the **authoritative 20Hz Tick + snapshot delivery** hot path:

- Colyseus room: `br_room`
- authoritative 20Hz / 50ms simulation
- schema delta patches at 20Hz
- validated, rate-limited input messages
- current-Tick server hitscan stub (no rewind)
- queue/backpressure and tick metric stubs
- no lobby, PixiJS, zone, loot, or sound yet

### Commands

```sh
npm install --allow-git=all
npm run dev
npm run build
npm run start
npm run loadtest -- --rooms=1 --clients=20
```

For capacity steps, run the representative bot at `--rooms=1`, `--rooms=10`, and `--rooms=25`, each with `--clients=20`. Evaluate room Tick p99, event-loop delay, process RSS, and bytes/player before raising density above 25 rooms/vCPU.

## Design handoff

Read [`HANDOFF.md`](./HANDOFF.md) first. It links all eight closed Wayfinder decisions.

Canonical domain vocabulary is in [`CONTEXT.md`](./CONTEXT.md). In particular, use **Match**, **Spawn**, **Tick**, **Zone**, **Armor/Plates**, and **Authoritative Server** as defined there.

The ticket #11 scaffold implements only the hot path from the following decision artifacts:

- `docs/research/03-netcode.md`
- `docs/research/04-perf-hosting.md`
- `docs/spec/hosting-infra.md`

## Out of scope for this slice

- Lobby/matchmaking — ticket #10
- PixiJS map rendering and 120° cone FOV — ticket #12
- Zone, loot, persistence, mobile tuning, audio/VFX, and progression
