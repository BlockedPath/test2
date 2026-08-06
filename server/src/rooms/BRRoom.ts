import { type Client, Room } from "colyseus";

import { Bullet, GameState, Player } from "../schema/State.js";

const TICK_HZ = 20;
const TICK_MS = 1_000 / TICK_HZ;
const MAX_MATCH_PLAYERS = 20;
const MAX_INPUTS_PER_SECOND = 20;
const MAX_QUEUED_BYTES = 256 * 1024;
const MOVE_SPEED_UNITS_PER_SECOND = 7;
const HITSCAN_RANGE = 18;
const HITSCAN_RADIUS = 0.8;
const HITSCAN_DAMAGE = 34;

type InputState = {
  moveX?: number;
  moveY?: number;
  aim?: number;
  shoot?: boolean;
};

type InputMessage = {
  seq: number;
  input: InputState;
  ts: number;
};

type InputWindow = {
  startedAt: number;
  accepted: number;
};

type TickMetrics = {
  averageTickMs: number;
  lastTickMs: number;
  maxTickMs: number;
  ticks: number;
  rejectedInputs: number;
  hitscanShots: number;
  disconnectedForBackpressure: number;
};

/**
 * Minimal authoritative Match hot path for ticket #11.
 *
 * It intentionally does not contain lobby, zone shrink, loot, full bullet
 * physics, persistence, or client prediction. Colyseus schema state is
 * automatically delta-patched at the configured patch rate.
 */
export class BRRoom extends Room<GameState> {
  maxClients = MAX_MATCH_PLAYERS;

  private readonly latestInputs = new Map<string, InputMessage>();
  private readonly inputWindows = new Map<string, InputWindow>();

  private metrics: TickMetrics = {
    averageTickMs: 0,
    lastTickMs: 0,
    maxTickMs: 0,
    ticks: 0,
    rejectedInputs: 0,
    hitscanShots: 0,
    disconnectedForBackpressure: 0,
  };

  onCreate(): void {
    this.setState(new GameState());

    // Schema mutations are automatically encoded as delta patches.
    this.setPatchRate(TICK_MS);

    // Tick is the canonical 20Hz, 50ms authoritative simulation step.
    this.setSimulationInterval((deltaTime) => {
      this.fixedTick(deltaTime);
    }, TICK_MS);

    this.onMessage("input", (client, message: unknown) => {
      this.acceptInput(client, message);
    });

    this.clock.setInterval(() => {
      this.emitMetricsStub();
    }, 10_000);
  }

  onJoin(client: Client): void {
    const player = new Player();

    // Spawn placement is deliberately temporary. Ticket #6 established
    // scattered Spawn + 2s invulnerability; that gameplay wiring belongs in
    // its dedicated implementation slice, not this server-hot-path scaffold.
    player.x = 0;
    player.y = 0;
    player.angle = 0;
    player.hp = 100;
    player.armor = 0;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client): void {
    this.latestInputs.delete(client.sessionId);
    this.inputWindows.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }

  private fixedTick(deltaTimeMs: number): void {
    const startedAt = performance.now();
    const deltaSeconds = deltaTimeMs / 1_000;

    this.state.tick += 1;

    for (const [sessionId, input] of this.latestInputs) {
      const player = this.state.players.get(sessionId);

      if (!player || player.hp === 0) {
        continue;
      }

      this.simulatePlayer(player, input, deltaSeconds);

      if (input.input.shoot) {
        this.resolveHitscan(sessionId, player);
      }
    }

    // Bullet state is a short-lived visible event stub only. Projectile
    // simulation, rewind, and ballistics are explicitly deferred.
    for (const [bulletId, bullet] of this.state.bullets) {
      if (bullet.spawnedAtTick < this.state.tick) {
        this.state.bullets.delete(bulletId);
      }
    }

    this.enforceBackpressureCap();

    const elapsedMs = performance.now() - startedAt;
    this.recordTickMetric(elapsedMs);
  }

  private simulatePlayer(
    player: Player,
    message: InputMessage,
    deltaSeconds: number,
  ): void {
    const moveX = clamp(message.input.moveX ?? 0, -1, 1);
    const moveY = clamp(message.input.moveY ?? 0, -1, 1);
    const magnitude = Math.hypot(moveX, moveY);
    const normalizedX = magnitude > 1 ? moveX / magnitude : moveX;
    const normalizedY = magnitude > 1 ? moveY / magnitude : moveY;

    player.x += normalizedX * MOVE_SPEED_UNITS_PER_SECOND * deltaSeconds;
    player.y += normalizedY * MOVE_SPEED_UNITS_PER_SECOND * deltaSeconds;

    if (typeof message.input.aim === "number") {
      player.angle = normalizeAngle(message.input.aim);
    }
  }

  /**
   * Current-Tick, server-authoritative hitscan stub.
   *
   * Per ticket #3, v1 has no rewind/lag compensation. The target is tested
   * against its position at this authoritative Tick.
   */
  private resolveHitscan(shooterSessionId: string, shooter: Player): void {
    const bullet = new Bullet();
    bullet.ownerSessionId = shooterSessionId;
    bullet.x = shooter.x;
    bullet.y = shooter.y;
    bullet.angle = shooter.angle;
    bullet.spawnedAtTick = this.state.tick;
    this.state.bullets.set(
      `${this.state.tick}:${shooterSessionId}`,
      bullet,
    );

    const directionX = Math.cos(shooter.angle);
    const directionY = Math.sin(shooter.angle);

    let closestTarget: Player | undefined;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const [sessionId, candidate] of this.state.players) {
      if (sessionId === shooterSessionId || candidate.hp === 0) {
        continue;
      }

      const toTargetX = candidate.x - shooter.x;
      const toTargetY = candidate.y - shooter.y;
      const alongRay = toTargetX * directionX + toTargetY * directionY;

      if (alongRay <= 0 || alongRay > HITSCAN_RANGE) {
        continue;
      }

      const perpendicularDistance = Math.abs(
        toTargetX * directionY - toTargetY * directionX,
      );

      if (
        perpendicularDistance <= HITSCAN_RADIUS &&
        alongRay < closestDistance
      ) {
        closestTarget = candidate;
        closestDistance = alongRay;
      }
    }

    if (closestTarget) {
      this.applyDamage(closestTarget, HITSCAN_DAMAGE);
    }

    this.metrics.hitscanShots += 1;
  }

  private applyDamage(target: Player, incomingDamage: number): void {
    const armorAbsorbed = Math.min(target.armor, incomingDamage);
    target.armor -= armorAbsorbed;

    const healthDamage = incomingDamage - armorAbsorbed;
    target.hp = Math.max(0, target.hp - healthDamage);
  }

  private acceptInput(client: Client, message: unknown): void {
    if (!isInputMessage(message)) {
      this.metrics.rejectedInputs += 1;
      return;
    }

    const existing = this.latestInputs.get(client.sessionId);
    if (existing && message.seq <= existing.seq) {
      this.metrics.rejectedInputs += 1;
      return;
    }

    const now = Date.now();
    const window = this.inputWindows.get(client.sessionId) ?? {
      startedAt: now,
      accepted: 0,
    };

    if (now - window.startedAt >= 1_000) {
      window.startedAt = now;
      window.accepted = 0;
    }

    if (window.accepted >= MAX_INPUTS_PER_SECOND) {
      this.metrics.rejectedInputs += 1;
      return;
    }

    window.accepted += 1;
    this.inputWindows.set(client.sessionId, window);

    // Latest input wins for this Tick; no unbounded per-client queue.
    this.latestInputs.set(client.sessionId, {
      seq: message.seq,
      ts: message.ts,
      input: {
        moveX: clamp(message.input.moveX ?? 0, -1, 1),
        moveY: clamp(message.input.moveY ?? 0, -1, 1),
        aim:
          typeof message.input.aim === "number"
            ? normalizeAngle(message.input.aim)
            : undefined,
        shoot: message.input.shoot === true,
      },
    });
  }

  private enforceBackpressureCap(): void {
    for (const client of this.clients) {
      /**
       * Colyseus transports hide their raw WebSocket implementation. This is a
       * safe no-op until the selected transport adapter exposes bufferedAmount.
       * Production must wire this to the actual ws/uWS queued-byte metric and
       * call client.leave(4008) for persistently slow consumers.
       */
      const bufferedAmount =
        (
          client as unknown as {
            bufferedAmount?: number;
            transport?: { bufferedAmount?: number };
          }
        ).bufferedAmount ??
        (
          client as unknown as {
            transport?: { bufferedAmount?: number };
          }
        ).transport?.bufferedAmount ??
        0;

      if (bufferedAmount > MAX_QUEUED_BYTES) {
        this.metrics.disconnectedForBackpressure += 1;
        client.leave(4008);
      }
    }
  }

  private recordTickMetric(elapsedMs: number): void {
    this.metrics.ticks += 1;
    this.metrics.lastTickMs = elapsedMs;
    this.metrics.maxTickMs = Math.max(this.metrics.maxTickMs, elapsedMs);
    this.metrics.averageTickMs +=
      (elapsedMs - this.metrics.averageTickMs) / this.metrics.ticks;
  }

  private emitMetricsStub(): void {
    console.info("br_room.tick_metrics", {
      roomId: this.roomId,
      players: this.clients.length,
      ...this.metrics,
      // Budget from docs/research/04-perf-hosting.md.
      averageTickBudgetMs: 1,
      p99TickBudgetMs: 2.5,
      maxClientsPerRoom: MAX_MATCH_PLAYERS,
    });
  }
}

function isInputMessage(value: unknown): value is InputMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Partial<InputMessage>;

  return (
    Number.isSafeInteger(message.seq) &&
    message.seq! >= 0 &&
    message.seq! <= 2_147_483_647 &&
    Number.isFinite(message.ts) &&
    Boolean(message.input) &&
    typeof message.input === "object"
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(value: number): number {
  const fullTurn = Math.PI * 2;
  const normalized = value % fullTurn;

  return normalized < 0 ? normalized + fullTurn : normalized;
}
