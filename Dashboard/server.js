import express from "express";
import http from "node:http";
import { Readable } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 3000);
const ESP_WS_URL = process.env.ESP_WS_URL || "ws://smarthelmet.local:81";
const CAMERA_URL = process.env.CAMERA_URL || "http://192.168.137.230:4747/video";
const app = express();
const server = http.createServer(app);
const browserClients = new WebSocketServer({ noServer: true });
let espConnected = false;
let espSocket;

function broadcast(message) {
  for (const client of browserClients.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

function broadcastStatus() {
  broadcast(`STATUS,${espConnected ? "CONNECTED" : "DISCONNECTED"}`);
}

function connectToEsp() {
  espSocket = new WebSocket(ESP_WS_URL);
  espSocket.on("open", () => {
    espConnected = true;
    console.log(`ESP32 connected: ${ESP_WS_URL}`);
    broadcastStatus();
  });
  espSocket.on("message", (packet) => broadcast(packet.toString()));
  espSocket.on("close", () => {
    espConnected = false;
    broadcastStatus();
    setTimeout(connectToEsp, 3000);
  });
  espSocket.on("error", () => {});
}

app.use(express.static("."));
app.get("/camera", async (_request, response, next) => {
  try {
    const cameraResponse = await fetch(CAMERA_URL);
    if (!cameraResponse.ok || !cameraResponse.body) {
      response.status(502).send("Camera stream unavailable.");
      return;
    }
    const contentType = cameraResponse.headers.get("content-type");
    if (contentType) response.setHeader("content-type", contentType);
    Readable.fromWeb(cameraResponse.body).pipe(response);
  } catch (error) {
    next(error);
  }
});

server.on("upgrade", (request, socket, head) => {
  if (request.url !== "/ws") return socket.destroy();
  browserClients.handleUpgrade(request, socket, head, (client) => {
    browserClients.emit("connection", client, request);
  });
});

browserClients.on("connection", (client) => {
  client.send(`STATUS,${espConnected ? "CONNECTED" : "DISCONNECTED"}`);

  // Forward dashboard SOS commands to the ESP32.
  client.on("message", (packet) => {
    if (espSocket?.readyState === WebSocket.OPEN) {
      espSocket.send(packet.toString());
    }
  });
});

server.listen(PORT, () => {
  console.log(`Dashboard backend: http://localhost:${PORT}`);
  connectToEsp();
});
