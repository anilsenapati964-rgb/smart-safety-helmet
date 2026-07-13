# Smart Safety Helmet

An ESP32-based industrial safety helmet prototype with a real-time web dashboard.

## Project structure

```text
Smart-Safety-Helmet/
├── Paper/                 # Final paper PDF
├── Hardware/              # Circuit diagram, sensor layout, prototype images
├── ESP32_Code/web_mpu/    # ESP32 firmware
├── Dashboard/             # Node.js server and web dashboard
├── Figures/               # Paper and project figures
└── Documentation/         # Setup and calibration notes
```

## Dashboard features

- Live helmet orientation visualization using Three.js
- Temperature, humidity, MQ2, and MQ135 sensor display
- Local WebSocket relay for ESP32 data
- Live camera panel and reset-view control

## Run the dashboard locally

```bash
cd Dashboard
npm install
npm start
```

Open `http://localhost:3000` in a browser. Connect the ESP32 to the same Wi-Fi network.

## Hardware used

ESP32, MPU9250, DHT11, MQ2, MQ135, safety helmet, and a prototype USB camera.
