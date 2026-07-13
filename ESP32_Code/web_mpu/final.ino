#include <ESPmDNS.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include <MPU9250_asukiaaa.h>
#include <DHT.h>

const char* ssid = ".";
const char* password = "123456789";

WebSocketsServer webSocket(81);

MPU9250_asukiaaa mpu;

//====================
// DHT11
//====================

#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

//====================
// MQ Sensors
//====================

#define MQ2_PIN 32
#define MQ135_PIN 33

//====================
// Ultrasonic sensor (HC-SR04 compatible)
// TRIG: ESP32 output, ECHO: use a 5 V-to-3.3 V level shifter/divider.
//====================

#define ULTRASONIC_TRIG_PIN 18
#define ULTRASONIC_ECHO_PIN 19

//====================
// SOS Button + LEDs
//====================

#define BUTTON_PIN 13
#define RED_LED 25
#define GREEN_LED 26

//====================
// Variables
//====================

float yaw = 0;

unsigned long lastIMU = 0;
unsigned long lastSensor = 0;
bool sosActive = false;
bool lastButtonState = HIGH;
unsigned long lastButtonPress = 0;

float readDistanceCm() {
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  const unsigned long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  return duration * 0.0343f / 2.0f;
}

void setSosState(bool active) {
  sosActive = active;

  digitalWrite(RED_LED, active ? HIGH : LOW);
  digitalWrite(GREEN_LED, active ? LOW : HIGH);

  webSocket.broadcastTXT(active ? "SOS,ON" : "SOS,OFF");
  Serial.println(active ? "SOS ON" : "SOS OFF");
}

void webSocketEvent(uint8_t num, WStype_t type,
                    uint8_t *payload, size_t length) {
  if (type != WStype_TEXT) return;

  String message = "";
  for (size_t i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if (message == "SOS,ON") setSosState(true);
  if (message == "SOS,OFF") setSosState(false);
}

void setup() {

  Serial.begin(115200);

  Wire.begin(21,22);

  mpu.setWire(&Wire);
  mpu.beginAccel();
  mpu.beginGyro();

  dht.begin();
  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
pinMode(RED_LED, OUTPUT);
pinMode(GREEN_LED, OUTPUT);

digitalWrite(RED_LED, LOW);
digitalWrite(GREEN_LED, HIGH);

  WiFi.begin(ssid,password);

  Serial.print("Connecting");

  while(WiFi.status()!=WL_CONNECTED){

    delay(500);
    Serial.print(".");

  }

  Serial.println();
  Serial.println("WiFi Connected");

  Serial.print("IP : ");
  Serial.println(WiFi.localIP());
  if (MDNS.begin("smarthelmet")) {
  Serial.println("ESP hostname: smarthelmet.local");
} else {
  Serial.println("mDNS failed");
}

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

}

//==================================================

void loop(){

  webSocket.loop();

  unsigned long now = millis();
  // SOS physical button toggle
bool buttonState = digitalRead(BUTTON_PIN);

if (lastButtonState == HIGH && buttonState == LOW &&
    now - lastButtonPress > 300) {

  setSosState(!sosActive);
  lastButtonPress = now;
}

lastButtonState = buttonState;

  //=========================================
  // IMU (50 FPS)
  //=========================================

  if(now-lastIMU>=20){

    lastIMU=now;

    mpu.accelUpdate();
    mpu.gyroUpdate();

    float ax=mpu.accelX();
    float ay=mpu.accelY();
    float az=mpu.accelZ();

    float roll=atan2(ay,az)*180/PI;

    float pitch=
    atan2(-ax,sqrt(ay*ay+az*az))*180/PI;

    yaw=0;

    String imuData=
    "R,"+
    String(roll,2)+","+
    String(pitch,2)+","+
    String(yaw,2);

    webSocket.broadcastTXT(imuData);

  }

  //=========================================
  // Sensors (1 Second)
  //=========================================

  if(now-lastSensor>=1000){

    lastSensor=now;

    float temp=dht.readTemperature();
    float hum=dht.readHumidity();

    int mq2=analogRead(MQ2_PIN);
    int mq135=analogRead(MQ135_PIN);
    float distanceCm=readDistanceCm();

    String sensorData=
    "S,"+
    String(mq2)+","+
    String(mq135)+","+
    String(temp,1)+","+
    String(hum,1)+","+
    String(distanceCm,1);

    webSocket.broadcastTXT(sensorData);

    // Serial Monitor

    Serial.println("--------------------------------");

    Serial.print("Temperature : ");
    Serial.println(temp);

    Serial.print("Humidity    : ");
    Serial.println(hum);

    Serial.print("MQ2         : ");
    Serial.println(mq2);

    Serial.print("MQ135       : ");
    Serial.println(mq135);

    Serial.print("Distance    : ");
    if (distanceCm < 0) Serial.println("Out of range");
    else {
      Serial.print(distanceCm, 1);
      Serial.println(" cm");
    }

  }

}
