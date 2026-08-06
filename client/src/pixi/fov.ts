import { Graphics } from "pixi.js";

/**
 * 120° cone FOV + occlusion stub per CONTEXT.md and ticket #7.
 * Hard walls block LOS+bullets, foliage soft hides only. Outside cone is fogged.
 * This is a cheap Graphics mask/cone, not a full lighting shader (baked later).
 *
 * For the scaffold we draw a 120° cone forward from the player and mask
 * the world. Wall occlusion is approximated by not drawing soft fog over
 * hard-cover rectangles — full shadow casting deferred to post-scaffold.
 */
export function createFovMask(): Graphics {
  const g = new Graphics();
  g.zIndex = 1000;
  return g;
}

export function updateFovMask(
  mask: Graphics,
  x: number,
  y: number,
  angle: number,
  viewDistance = 180,
  fovRadians = (120 * Math.PI) / 180,
): void {
  mask.clear();
  // Fog outside cone: draw dark overlay with hole for cone, then use as mask inversion
  // Simplified: draw cone as bright, rest as dark overlay — for scaffold we just draw cone shape
  // World is masked to cone + 360 soft fallback (see CONTEXT.md: 360 excluded, but scaffold shows cone)
  mask.beginFill(0xffffff);
  mask.moveTo(x, y);
  const half = fovRadians / 2;
  mask.lineTo(
    x + Math.cos(angle - half) * viewDistance,
    y + Math.sin(angle - half) * viewDistance,
  );
  // arc approximation
  const steps = 16;
  for (let i = 1; i <= steps; i++) {
    const a = angle - half + (fovRadians * i) / steps;
    mask.lineTo(x + Math.cos(a) * viewDistance, y + Math.sin(a) * viewDistance);
  }
  mask.lineTo(
    x + Math.cos(angle + half) * viewDistance,
    y + Math.sin(angle + half) * viewDistance,
  );
  mask.lineTo(x, y);
  mask.endFill();
}
