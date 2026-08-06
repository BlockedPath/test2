import { Client, type Room } from "colyseus.js";

type PlayerSnapshot = {
  x: number;
  y: number;
  angle: number;
  hp: number;
  armor: number;
};

type StateSnapshot = {
  tick: number;
  players: Map<string, PlayerSnapshot>;
};

const statusElement = document.querySelector<HTMLParagraphElement>(
  "#connection-status",
);
const outputElement = document.querySelector<HTMLPreElement>(
  "#snapshot-output",
);

if (!statusElement || !outputElement) {
  throw new Error("Tick scaffold HTML is missing required output elements.");
}

const endpoint =
  (import.meta as unknown as { env: { VITE_COLYSEUS_ENDPOINT?: string } }).env.VITE_COLYSEUS_ENDPOINT ??
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:2567`;

const client = new Client(endpoint);
let room: Room<StateSnapshot>;
let sequence = 0;
let latestState: StateSnapshot | undefined;
let previousState: StateSnapshot | undefined;
let latestSnapshotAt = performance.now();

const pressedKeys = new Set<string>();
let pointerAngle = 0;
let wantsToShoot = false;

window.addEventListener("keydown", (event) => {
  pressedKeys.add(event.key.toLowerCase());
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.key.toLowerCase());
});

window.addEventListener("pointermove", (event) => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  pointerAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
});

window.addEventListener("pointerdown", () => {
  wantsToShoot = true;
});

window.addEventListener("pointerup", () => {
  wantsToShoot = false;
});

void connect();

async function connect(): Promise<void> {
  statusElement!.textContent = `Connecting to ${endpoint}…`;

  room = await client.joinOrCreate<StateSnapshot>("br_room");

  statusElement!.textContent = `Connected to Match ${room.roomId}`;

  /**
   * Colyseus delivers 20Hz schema delta patches. This placeholder captures
   * successive snapshots and interpolates them on requestAnimationFrame.
   * PixiJS rendering is deliberately deferred to ticket #12.
   */
  room.onStateChange((nextState: StateSnapshot) => {
    previousState = latestState;
    latestState = nextState;
    latestSnapshotAt = performance.now();
  });

  window.setInterval(() => {
    room.send("input", {
      seq: sequence++,
      ts: Date.now(),
      input: {
        moveX: axis("d", "a"),
        moveY: axis("s", "w"),
        aim: pointerAngle,
        shoot: wantsToShoot,
      },
    });

    wantsToShoot = false;
  }, 50);

  requestAnimationFrame(renderInterpolationStub);
}

function renderInterpolationStub(now: number): void {
  if (latestState) {
    // At 20Hz, render between patches for a 60Hz display. Clamping prevents
    // extrapolating stale server state; client prediction is intentionally off.
    const alpha = Math.min(1, Math.max(0, (now - latestSnapshotAt) / 50));
    const ownPlayer = latestState.players.get(room.sessionId);
    const priorPlayer = previousState?.players.get(room.sessionId);

    const x = interpolate(priorPlayer?.x ?? ownPlayer?.x ?? 0, ownPlayer?.x ?? 0, alpha);
    const y = interpolate(priorPlayer?.y ?? ownPlayer?.y ?? 0, ownPlayer?.y ?? 0, alpha);

    outputElement!.textContent = JSON.stringify(
      {
        tick: latestState.tick,
        interpolationAlpha: Number(alpha.toFixed(2)),
        ownPlayer: {
          x: Number(x.toFixed(2)),
          y: Number(y.toFixed(2)),
          hp: ownPlayer?.hp ?? 0,
          armor: ownPlayer?.armor ?? 0,
        },
      },
      null,
      2,
    );
  }

  requestAnimationFrame(renderInterpolationStub);
}

function axis(positive: string, negative: string): number {
  return Number(pressedKeys.has(positive)) - Number(pressedKeys.has(negative));
}

function interpolate(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}
