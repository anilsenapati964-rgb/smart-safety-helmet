# Smart Safety Helmet

Web dashboard for an ESP32-based smart safety helmet prototype.

## Features

- Live helmet orientation visualization with Three.js
- Temperature, humidity, MQ2, and MQ135 sensor display
- Local WebSocket relay for ESP32 data
- Live camera panel and dashboard reset control

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000` in a browser. Connect the ESP32 to the same Wi-Fi network and configure its WebSocket endpoint through the dashboard/server settings.

## Hardware used

ESP32, MPU9250, DHT11, MQ2, MQ135, safety helmet, and a prototype USB camera.

