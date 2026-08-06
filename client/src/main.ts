import { Client, type Room } from "colyseus.js";
import type { Graphics } from "pixi.js";

import { createPixiApp } from "./pixi/app.js";
import { createFovMask, updateFovMask } from "./pixi/fov.js";
import { WORLD_SIZE, createPlayerGraphics, createWorld } from "./pixi/scene.js";

type PlayerSnapshot = { x: number; y: number; angle: number; hp: number; armor: number };
type StateSnapshot = { tick: number; players: Map<string, PlayerSnapshot> };

const statusElement = document.querySelector<HTMLParagraphElement>("#connection-status");
const pixiContainer = document.querySelector<HTMLDivElement>("#pixi-root");
const debugElement = document.querySelector<HTMLPreElement>("#snapshot-output");

if (!statusElement || !pixiContainer || !debugElement) {
  throw new Error("HTML missing #connection-status / #pixi-root / #snapshot-output.");
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

window.addEventListener("keydown", (e) => pressedKeys.add(e.key.toLowerCase()));
window.addEventListener("keyup", (e) => pressedKeys.delete(e.key.toLowerCase()));
window.addEventListener("pointermove", (e) => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  pointerAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
});
window.addEventListener("pointerdown", () => (wantsToShoot = true));
window.addEventListener("pointerup", () => (wantsToShoot = false));

// Pixi world
const app = await createPixiApp(pixiContainer, 800, 800);
const world = createWorld();
app.stage.addChild(world);

const fovMask = createFovMask();
world.addChild(fovMask);
world.mask = fovMask;

const playerNodes = new Map<string, { g: Graphics; color: number }>();
const colors = [0x00ff88, 0xff4444, 0x44aaff, 0xffaa00, 0xaa44ff];

function getPlayerNode(sessionId: string): Graphics {
  let entry = playerNodes.get(sessionId);
  if (!entry) {
    const color = colors[playerNodes.size % colors.length]!;
    const g = createPlayerGraphics(color);
    entry = { g, color };
    playerNodes.set(sessionId, entry);
    world.addChild(g);
  }
  return entry.g;
}

void connect();

async function connect(): Promise<void> {
  statusElement!.textContent = `Connecting to ${endpoint}…`;
  room = await client.joinOrCreate<StateSnapshot>("br_room");
  statusElement!.textContent = `Connected ${room.roomId} — Pixi 7.4 @ 60fps, 20→60 interp, cone 120°`;

  room.onStateChange((next: StateSnapshot) => {
    previousState = latestState;
    latestState = next;
    latestSnapshotAt = performance.now();
  });

  setInterval(() => {
    if (!room) return;
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

  requestAnimationFrame(tick);
}

function tick(now: number): void {
  if (latestState) {
    const alpha = Math.min(1, Math.max(0, (now - latestSnapshotAt) / 50));

    // Update player sprites via interpolation (snapshot-interpolation style lerp)
    for (const [sid, snap] of latestState.players) {
      const prior = previousState?.players.get(sid);
      const x = lerp(prior?.x ?? snap.x, snap.x, alpha);
      const y = lerp(prior?.y ?? snap.y, snap.y, alpha);
      const angle = lerpAngle(prior?.angle ?? snap.angle, snap.angle, alpha);
      const node = getPlayerNode(sid);
      node.x = x;
      node.y = y;
      node.rotation = angle;
    }
    // Remove disconnected
    for (const sid of [...playerNodes.keys()]) {
      if (!latestState.players.has(sid)) {
        const entry = playerNodes.get(sid);
        if (entry) {
          world.removeChild(entry.g);
          playerNodes.delete(sid);
        }
      }
    }

    // Camera: tight follow with mouse look-ahead (per CONTEXT.md)
    const own = latestState.players.get(room.sessionId);
    const priorOwn = previousState?.players.get(room.sessionId);
    if (own) {
      const cx = lerp(priorOwn?.x ?? own.x, own.x, alpha);
      const cy = lerp(priorOwn?.y ?? own.y, own.y, alpha);
      const lookAhead = 60;
      const lx = Math.cos(own.angle) * lookAhead;
      const ly = Math.sin(own.angle) * lookAhead;
      const camX = WORLD_SIZE / 2 - (cx + lx * 0.3);
      const camY = WORLD_SIZE / 2 - (cy + ly * 0.3);
      world.x = camX;
      world.y = camY;

      // FOV cone (120° forward, soft)
      updateFovMask(fovMask, cx, cy, own.angle);

      debugElement!.textContent = JSON.stringify(
        { tick: latestState.tick, alpha: Number(alpha.toFixed(2)), own: { x: Math.round(cx), y: Math.round(cy), hp: own.hp } },
        null,
        2,
      );
    }
  }

  // draw-call guardrail hint (§4): keep world children ≤50/100, no extra filters this scaffold
  requestAnimationFrame(tick);
}

function axis(pos: string, neg: string): number {
  return Number(pressedKeys.has(pos)) - Number(pressedKeys.has(neg));
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
