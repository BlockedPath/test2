import { MapSchema, Schema, type } from "@colyseus/schema";

/**
 * Canonical vocabulary lives in CONTEXT.md:
 * - Match is one solo instance.
 * - Tick is the authoritative 20Hz (50ms) simulation step.
 * - Armor/Plates absorb damage before HP.
 */
export class Player extends Schema {
  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("number")
  angle = 0;

  @type("uint8")
  hp = 100;

  @type("uint8")
  armor = 0;
}

/**
 * The hot path currently uses server-side hitscan. Bullet records are retained
 * for one Tick as an inspectable event/state stub; projectile simulation is
 * explicitly outside ticket #11.
 */
export class Bullet extends Schema {
  @type("string")
  ownerSessionId = "";

  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("number")
  angle = 0;

  @type("uint32")
  spawnedAtTick = 0;
}

export class GameState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type({ map: Bullet })
  bullets = new MapSchema<Bullet>();

  @type("uint8")
  zonePhase = 0;

  @type("uint32")
  tick = 0;
}
