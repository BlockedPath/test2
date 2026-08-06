import { Client, type Room } from "colyseus.js";
import type { Graphics } from "pixi.js";

import { AudioManager } from "./audio/audio.js";
import { FxPool } from "./fx/pool.js";
import { createLobbyUI } from "./lobby/lobby.js";
import { createPixiApp } from "./pixi/app.js";
import { createFovMask, updateFovMask } from "./pixi/fov.js";
import { WORLD_SIZE, createPlayerGraphics, createWorld } from "./pixi/scene.js";

type PlayerSnapshot = { x: number; y: number; angle: number; hp: number; armor: number };
type StateSnapshot = {
  tick: number;
  lobby: boolean;
  lobbyCountdown: number;
  players: Map<string, PlayerSnapshot>;
  ready: Map<string, boolean>;
  bullets: Map<string, { x: number; y: number; angle: number; ownerSessionId: string; spawnedAtTick: number }>;
};

// LobbyState mirrors server ready map shape

const statusElement = document.querySelector<HTMLParagraphElement>("#connection-status");
const lobbyContainer = document.querySelector<HTMLDivElement>("#lobby-root");
const pixiContainer = document.querySelector<HTMLDivElement>("#pixi-root");
const debugElement = document.querySelector<HTMLPreElement>("#snapshot-output");

if (!statusElement || !lobbyContainer || !pixiContainer || !debugElement) {
  throw new Error("HTML missing #connection-status / #lobby-root / #pixi-root / #snapshot-output.");
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

// Pixi world (hidden until lobby ends)
const app = await createPixiApp(pixiContainer, 800, 800);
const world = createWorld();
app.stage.addChild(world);
const fovMask = createFovMask();
world.addChild(fovMask);
world.mask = fovMask;

// Audio + FX per #13: pooled, ≤6 concurrent, distance-attenuated 120m
const audio = new AudioManager();
const fx = new FxPool(world);
// Mute toggle (persists via localStorage)
const muteBtn = document.createElement("button");
muteBtn.textContent = localStorage.getItem("br_muted") === "1" ? "Unmute" : "Mute";
muteBtn.style.cssText = "margin-left:12px;padding:4px 8px;";
muteBtn.addEventListener("click", () => {
  const m = audio.toggleMute();
  muteBtn.textContent = m ? "Unmute" : "Mute";
});
statusElement.parentElement?.appendChild(muteBtn);

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

// Lobby UI
const lobbyUI = createLobbyUI(lobbyContainer, (ready) => {
  if (!room) return;
  room.send("ready", { ready });
});
// Dev shortcut: start with 2 for solo testing (bypasses 10-ready gate)
const devBtn = document.createElement("button");
devBtn.textContent = "Start with 2 (dev)";
devBtn.title = "Solo test: start match with 2 players";
devBtn.style.cssText = "margin:8px auto;display:block;padding:6px 12px;background:#d73;color:#fff;border:none;cursor:pointer;";
devBtn.addEventListener("click", () => {
  if (!room) return;
  room.send("dev_start", {});
});
lobbyContainer.appendChild(devBtn);

void connect();

async function connect(): Promise<void> {
  statusElement!.textContent = `Connecting to ${endpoint}…`;
  room = await client.joinOrCreate<StateSnapshot>("br_room");
  statusElement!.textContent = `Lobby ${room.roomId} — waiting for 10 ready (≥6 after 30s)`;

  room.onStateChange((next: StateSnapshot) => {
    previousState = latestState;
    latestState = next;
    latestSnapshotAt = performance.now();

    // Update lobby UI
    lobbyUI.update({ lobby: next.lobby, countdown: next.lobbyCountdown, players: next.ready }, room.sessionId);
    lobbyUI.setCountdown(next.lobbyCountdown);

    // Toggle lobby vs game view
    if (next.lobby) {
      lobbyContainer!.style.display = "";
      pixiContainer!.style.display = "none";
      statusElement!.textContent = `Lobby ${room.roomId} — ${next.players.size}/20 players — ${[...next.ready.values()].filter(Boolean).length} ready`;
    } else {
      lobbyContainer!.style.display = "none";
      pixiContainer!.style.display = "";
      statusElement!.textContent = `Match ${room.roomId} — Pixi 7.4 @ 60fps, 20→60 interp, cone 120°`;
    }
  });

  room.onMessage("match_start", () => {
    statusElement!.textContent = `Match started — ${room.roomId}`;
  });

  room.onLeave((code) => {
    // 15s reconnect window per #10: colyseus.js will auto-reconnect if allowReconnection was used
    statusElement!.textContent = `Left (code ${code}) — reconnect within 15s if in match`;
  });

  setInterval(() => {
    if (!room || latestState?.lobby) return;
    const shooting = wantsToShoot;
    // Local FX/audio prediction (pooled, ≤6 concurrent, no per-tick alloc)
    if (shooting && latestState) {
      const own = latestState.players.get(room.sessionId);
      if (own) {
        fx.muzzle(own.x, own.y, pointerAngle);
        audio.play("shoot_ar", 0);
      }
    }
    room.send("input", {
      seq: sequence++,
      ts: Date.now(),
      input: {
        moveX: axis("d", "a"),
        moveY: axis("s", "w"),
        aim: pointerAngle,
        shoot: shooting,
      },
    });
    wantsToShoot = false;
  }, 50);

  requestAnimationFrame(tick);
}

function tick(now: number): void {
  if (latestState && !latestState.lobby) {
    const alpha = Math.min(1, Math.max(0, (now - latestSnapshotAt) / 50));
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
    for (const sid of [...playerNodes.keys()]) {
      if (!latestState.players.has(sid)) {
        const entry = playerNodes.get(sid);
        if (entry) {
          world.removeChild(entry.g);
          playerNodes.delete(sid);
        }
      }
    }
    const own = latestState.players.get(room.sessionId);
    const priorOwn = previousState?.players.get(room.sessionId);
    if (own) {
      const cx = lerp(priorOwn?.x ?? own.x, own.x, alpha);
      const cy = lerp(priorOwn?.y ?? own.y, own.y, alpha);
      const lookAhead = 60;
      const lx = Math.cos(own.angle) * lookAhead;
      const ly = Math.sin(own.angle) * lookAhead;
      world.x = WORLD_SIZE / 2 - (cx + lx * 0.3);
      world.y = WORLD_SIZE / 2 - (cy + ly * 0.3);
      updateFovMask(fovMask, cx, cy, own.angle);
      debugElement!.textContent = JSON.stringify(
        { tick: latestState.tick, alpha: Number(alpha.toFixed(2)), own: { x: Math.round(cx), y: Math.round(cy), hp: own.hp } },
        null,
        2,
      );
    }
  }
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
