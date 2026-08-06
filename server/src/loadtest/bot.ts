import { Client, type Room } from "colyseus.js";
import WebSocket from "ws";

type BotRoom = Room<unknown>;

const endpoint = process.env.COLYSEUS_ENDPOINT ?? "ws://localhost:2567";
const roomCount = parsePositiveArgument("rooms", 1);
const clientsPerRoom = parsePositiveArgument("clients", 20);
const durationMs = parsePositiveArgument("duration-ms", 15_000);

if (clientsPerRoom > 20) {
  throw new Error("--clients must be ≤20 because br_room maxClients is 20.");
}

/**
 * colyseus.js uses browser WebSocket by default. Node load testing injects ws.
 */
// @ts-expect-error - ws vs DOM WebSocket type mismatch is intentional for Node loadtest
(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

console.info("loadtest.start", {
  endpoint,
  roomCount,
  clientsPerRoom,
  durationMs,
  matrix: "Run --rooms=1, then --rooms=10, then --rooms=25.",
});

const allRooms = await Promise.all(
  Array.from({ length: roomCount }, (_, roomIndex) =>
    createRoomPopulation(roomIndex),
  ),
);

await sleep(durationMs);

for (const population of allRooms) {
  for (const room of population) {
    await room.leave();
  }
}

console.info("loadtest.complete", {
  rooms: roomCount,
  clients: roomCount * clientsPerRoom,
});

async function createRoomPopulation(roomIndex: number): Promise<BotRoom[]> {
  const ownerClient = new Client(endpoint);
  const owner = await ownerClient.create<unknown>("br_room", {
    loadtestRoomIndex: roomIndex,
  });

  const population: BotRoom[] = [owner];

  for (let clientIndex = 1; clientIndex < clientsPerRoom; clientIndex += 1) {
    const client = new Client(endpoint);
    population.push(await client.joinById<unknown>(owner.roomId));
  }

  population.forEach((room, botIndex) => {
    let sequence = 0;
    const inputTimer = setInterval(() => {
      const time = Date.now() / 1_000;
      const angle = time + botIndex * 0.314;

      room.send("input", {
        seq: sequence++,
        ts: Date.now(),
        input: {
          moveX: Math.cos(angle),
          moveY: Math.sin(angle),
          aim: angle,
          shoot: sequence % 5 === 0,
        },
      });
    }, 50);

    room.onLeave(() => {
      clearInterval(inputTimer);
    });
  });

  console.info("loadtest.room_populated", {
    roomIndex,
    roomId: owner.roomId,
    clients: population.length,
  });

  return population;
}

function parsePositiveArgument(name: string, fallback: number): number {
  const argument = process.argv.find((value) => value.startsWith(`--${name}=`));
  const rawValue = argument?.split("=")[1];
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : fallback;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive integer.`);
  }

  return parsed;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
