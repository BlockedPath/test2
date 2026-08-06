import { Container, Graphics } from "pixi.js";

/**
 * Map language from docs/spec/map-language.md: 800×800, 50×50 tiles, 5 POIs,
 * cross roads 8m, medium 120m caps. Tiles are 16×16 px at 800/50.
 */
export const WORLD_SIZE = 800;
export const TILES = 50;
export const TILE_SIZE = WORLD_SIZE / TILES; // 16

export type POI = { name: string; x: number; y: number; w: number; h: number; color: number };

export const POIS: POI[] = [
  { name: "Citadel", x: 340, y: 340, w: 120, h: 120, color: 0x8b0000 }, // hot center
  { name: "North Depot", x: 340, y: 80, w: 120, h: 80, color: 0x334455 },
  { name: "East Yard", x: 600, y: 340, w: 100, h: 120, color: 0x445566 },
  { name: "South Outpost", x: 340, y: 600, w: 120, h: 80, color: 0x556677 },
  { name: "West Fields", x: 80, y: 340, w: 100, h: 120, color: 0x667788 },
];

export function createWorld(): Container {
  const world = new Container();
  world.sortableChildren = true;

  // Terrain base
  const base = new Graphics();
  base.beginFill(0x2b2b2b);
  base.drawRect(0, 0, WORLD_SIZE, WORLD_SIZE);
  base.endFill();
  base.zIndex = 0;
  world.addChild(base);

  // Grid (light)
  const grid = new Graphics();
  grid.lineStyle(1, 0x3a3a3a, 0.5);
  for (let i = 0; i <= TILES; i++) {
    const p = i * TILE_SIZE;
    grid.moveTo(p, 0);
    grid.lineTo(p, WORLD_SIZE);
    grid.moveTo(0, p);
    grid.lineTo(WORLD_SIZE, p);
  }
  grid.zIndex = 1;
  world.addChild(grid);

  // Cross roads (8m ≈ 8px at this scale, exaggerated to 12 for visibility)
  const roads = new Graphics();
  roads.beginFill(0x4a4a4a);
  roads.drawRect(0, 400 - 6, WORLD_SIZE, 12);
  roads.drawRect(400 - 6, 0, 12, WORLD_SIZE);
  roads.endFill();
  roads.zIndex = 2;
  world.addChild(roads);

  // POIs
  for (const poi of POIS) {
    const g = new Graphics();
    g.beginFill(poi.color);
    g.drawRect(poi.x, poi.y, poi.w, poi.h);
    g.endFill();
    g.lineStyle(2, 0xffffff, 0.2);
    g.drawRect(poi.x, poi.y, poi.w, poi.h);
    g.zIndex = 3;
    world.addChild(g);
  }

  // Hard cover examples to show 120m caps (7–8 tiles ≈ 112–128 px)
  const cover = new Graphics();
  cover.beginFill(0x111111);
  // scattered walls
  const walls = [
    [200, 200, 40, 8],
    [500, 200, 8, 60],
    [200, 500, 60, 8],
    [500, 500, 40, 40],
  ] as const;
  for (const [x, y, w, h] of walls) {
    cover.drawRect(x, y, w, h);
  }
  cover.endFill();
  cover.zIndex = 4;
  world.addChild(cover);

  return world;
}

export function createPlayerGraphics(color: number): Graphics {
  const g = new Graphics();
  g.beginFill(color);
  g.drawCircle(0, 0, 8);
  g.endFill();
  g.lineStyle(2, 0xffffff);
  g.moveTo(0, 0);
  g.lineTo(12, 0); // facing
  return g;
}
