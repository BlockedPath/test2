import { type Container, Graphics } from "pixi.js";

/**
 * Pooled FX per #13: muzzle (4–6f), hit spark, smoke puff, explosion (8–16f).
 * Additive for flash, alpha for smoke, no full-screen filters v1. Pooled to avoid per-tick allocations (§4).
 */
export class FxPool {
  private readonly pool: Graphics[] = [];
  private readonly active: Set<Graphics> = new Set();

  constructor(
    private readonly world: Container,
    private readonly maxSize = 32,
  ) {}

  private acquire(): Graphics {
    const g = this.pool.pop() ?? new Graphics();
    g.visible = true;
    g.alpha = 1;
    this.active.add(g);
    if (!g.parent) this.world.addChild(g);
    return g;
  }

  private release(g: Graphics, afterMs: number): void {
    setTimeout(() => {
      g.visible = false;
      g.clear();
      this.active.delete(g);
      if (this.pool.length < this.maxSize) this.pool.push(g);
      else if (g.parent) g.parent.removeChild(g);
    }, afterMs);
  }

  muzzle(x: number, y: number, angle: number): void {
    const g = this.acquire();
    g.clear();
    g.beginFill(0xffff99);
    g.drawCircle(x, y, 6);
    g.endFill();
    g.x = 0;
    g.y = 0;
    // additive-like bright, no filter
    this.release(g, 90);
  }

  hit(x: number, y: number): void {
    const g = this.acquire();
    g.clear();
    g.lineStyle(2, 0xffaa00);
    g.drawCircle(x, y, 4);
    g.drawCircle(x, y, 8);
    this.release(g, 120);
  }

  smoke(x: number, y: number): void {
    const g = this.acquire();
    g.clear();
    g.beginFill(0x888888, 0.4);
    g.drawCircle(x, y, 10);
    g.endFill();
    this.release(g, 400);
  }

  get activeCount(): number {
    return this.active.size;
  }
}
