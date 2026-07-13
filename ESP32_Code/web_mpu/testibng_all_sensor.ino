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
// Variables
//====================

float yaw = 0;

unsigned long lastIMU = 0;
unsigned long lastSensor = 0;

void setup() {

  Serial.begin(115200);

  Wire.begin(21,22);

  mpu.setWire(&Wire);
  mpu.beginAccel();
  mpu.beginGyro();

  dht.begin();

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

  webSocket.begin();

}

//==================================================

void loop(){

  webSocket.loop();

  unsigned long now = millis();

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

    String sensorData=
    "S,"+
    String(mq2)+","+
    String(mq135)+","+
    String(temp,1)+","+
    String(hum,1);

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

  }

}
