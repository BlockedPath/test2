import { Graphics } from "pixi.js";
import { WORLD_SIZE } from "./scene.js";

/**
 * Soft FOV: outside cone is dimmed 70% (not black), inside cone is clear.
 * Fixes "cant see" — world remains visible for navigation, cone is tactical highlight.
 * Hard wall occlusion still stubbed; full shadow casting deferred.
 */
export function createFovOverlay(): Graphics {
  const g = new Graphics();
  g.zIndex = 1000;
  return g;
}

export function updateFovOverlay(
  overlay: Graphics,
  x: number,
  y: number,
  angle: number,
  viewDistance = 320,
  fovRadians = (120 * Math.PI) / 180,
): void {
  overlay.clear();
  // Darken whole world outside cone — soft fog, not hard mask
  overlay.beginFill(0x000000, 0.72);
  overlay.drawRect(0, 0, WORLD_SIZE, WORLD_SIZE);
  // Cut hole for cone (bright)
  overlay.beginHole();
  overlay.moveTo(x, y);
  const half = fovRadians / 2;
  overlay.lineTo(x + Math.cos(angle - half) * viewDistance, y + Math.sin(angle - half) * viewDistance);
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    const a = angle - half + (fovRadians * i) / steps;
    overlay.lineTo(x + Math.cos(a) * viewDistance, y + Math.sin(a) * viewDistance);
  }
  overlay.lineTo(x + Math.cos(angle + half) * viewDistance, y + Math.sin(angle + half) * viewDistance);
  overlay.lineTo(x, y);
  overlay.endHole();
  overlay.endFill();

  // Small bright circle at player so you always see yourself
  overlay.beginFill(0x000000, 0);
  overlay.drawCircle(x, y, 10);
  overlay.endFill();
}

// Back-compat shims for older main.ts that used mask API
export const createFovMask = createFovOverlay;
export const updateFovMask = updateFovOverlay;
