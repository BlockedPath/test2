import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { BRRoom } from "./rooms/BRRoom.js";

const port = Number.parseInt(process.env.PORT ?? "2567", 10);

if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
  throw new Error(`PORT must be a valid TCP port; received ${process.env.PORT}`);
}

const transport = new WebSocketTransport({
  maxPayload: 1_024 * 1_024,
});

const gameServer = new Server({ transport });

gameServer.define("br_room", BRRoom);

gameServer.listen(port);

console.info(
  `BR authoritative server listening on :${port}; ` +
    "room=br_room, Tick=20Hz, patch=20Hz",
);
