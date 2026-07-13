const socketProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${socketProtocol}://${window.location.host}/ws`);
window.helmetSocket = socket;

const setConnectionStatus = (connected) => {
    const status = document.getElementById("connectionStatus");
    status.textContent = connected ? "CONNECTED" : "DISCONNECTED";
};

socket.onopen = () => {
    console.log("Dashboard backend connected");
    document.getElementById("connectionStatus").textContent = "CONNECTING";
};

socket.onclose = () => setConnectionStatus(false);
socket.onerror = (error) => console.error("WebSocket error", error);

socket.onmessage = (event) => {
    const data = event.data.trim().split(",");
    if (data[0] === "STATUS") {
        setConnectionStatus(data[1] === "CONNECTED");
        return;
    }

    // Physical SOS button packet from ESP32.
    if (data[0] === "SOS") {
        window.setSosAlert?.(data[1] === "ON");
        return;
    }

    if (data[0] === "R") {
        const [roll, pitch, yaw] = data.slice(1).map(Number);
        if ([roll, pitch, yaw].every(Number.isFinite)) window.updateOrientation(roll, pitch, yaw);
        return;
    }

    if (data[0] !== "S") return;
    const [mq2, mq135, temp, hum] = data.slice(1).map(Number);

    if (Number.isFinite(mq2)) {
        document.getElementById("mq2Value").textContent = Math.round(mq2);
        document.getElementById("mq2Bar").style.width = `${Math.min(100, Math.max(0, mq2 / 4095 * 100))}%`;
    }

    if (Number.isFinite(mq135)) {
        document.getElementById("mq135Value").textContent = Math.round(mq135);
        document.getElementById("mq135Bar").style.width = `${Math.min(100, Math.max(0, mq135 / 4095 * 100))}%`;
        const air = document.getElementById("air");
        if (mq135 < 1500) {
            air.textContent = "GOOD";
            air.style.color = "#00ff66";
        } else if (mq135 < 2500) {
            air.textContent = "MODERATE";
            air.style.color = "#ffd700";
        } else {
            air.textContent = "POOR";
            air.style.color = "#ff4444";
        }
    }

    document.getElementById("temp").textContent = Number.isFinite(temp) ? temp.toFixed(1) : "--";
    document.getElementById("hum").textContent = Number.isFinite(hum) ? hum.toFixed(1) : "--";
};
